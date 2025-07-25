import { logger } from '@ugm/logger';
import ollama from 'ollama';
import { Queue, QueueEvents } from 'bullmq';

const MAX_ATTEMPTS = 3;
const BACK_OFF_DELAY = 5000;
const redisOptions = { host: "localhost", port: 6379 };
logger.level='debug';
// for returning results and notification to requestor
const webHookQueue = new Queue("webhooks", { connection: redisOptions });

async function sendChat(messages, model, max_tokens = 4096) {
  try {
    logger.debug(`sendChat : messages :", ${model}, ${max_tokens}, ${JSON.stringify(messages)}`);
    // Validate inputs
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      throw new Error('Messages must be a non-empty array');
    }
    if (!model || typeof model !== 'string') {
      throw new Error('Model must be a non-empty string');
    }
    if (max_tokens && (typeof max_tokens !== 'number' || max_tokens <= 0)) {
      throw new Error('max_tokens must be a positive number');
    }

    // Prepare the chat request
    const request = {
      model: model,
      messages: messages,
      max_tokens: max_tokens || 4096, // Default to 4096 if not provided
      stream: false // Set to true if you want streaming responses
    };

    // Send the chat request to Ollama
    const response = await ollama.chat(request);
    //logger.debug(`ollama: response : ${JSON.stringify(response)}`)
    // Return the response content
    return response
  } catch (error) {
    logger.error('Error interacting with Ollama:', error.message);
    throw error;
  }
}

async function sendChatStreaming(messages, model, max_tokens = 4096, job, emitDeltaEvent) {
  try {
    logger.debug(`sendChatStreaming : starting with model=${model}, max_tokens=${max_tokens}`);
    logger.debug(`Messages: ${JSON.stringify(messages)}`);
    
    // Validate inputs
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      throw new Error('Messages must be a non-empty array');
    }
    if (!model || typeof model !== 'string') {
      throw new Error('Model must be a non-empty string');
    }
    if (max_tokens && (typeof max_tokens !== 'number' || max_tokens <= 0)) {
      throw new Error('max_tokens must be a positive number');
    }

    // Prepare the chat request
    const request = {
      model: model,
      messages: messages,
      options: {
        num_predict: max_tokens || 4096
      },
      stream: true // Enable streaming responses
    };

    let fullContent = '';
    
    logger.debug('Starting Ollama streaming request');
    
    // Create a promise that will resolve when streaming is complete
    return new Promise((resolve, reject) => {
      // Use the fetch API directly for more control over the streaming
      fetch('http://localhost:11434/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        logger.debug('Ollama streaming response started');
        
        // Get the reader from the response body stream
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        
        // Function to process each chunk
        function processChunk() {
          // Read the next chunk
          return reader.read().then(({ done, value }) => {
            // If we're done, resolve the promise with the full content
            if (done) {
              logger.debug('Streaming complete, full content length: ' + fullContent.length);
              resolve(fullContent);
              return;
            }
            
            // Decode the chunk
            const chunk = decoder.decode(value, { stream: true });
            logger.debug(`Received chunk of size: ${chunk.length}`);
            
            // Process each line in the chunk (each line is a JSON object)
            const lines = chunk.split('\n').filter(line => line.trim());
            
            // Process each line
            lines.forEach(async line => {
              try {
                const data = JSON.parse(line);
                
                // Check if this is a message with content
                if (data.message && data.message.content) {
                  const content = data.message.content;
                  fullContent += content;
                  
                  logger.debug(`Delta content: "${content}"`);
                  // assemble event data
                  //const cdata = {id:job.id,jobname:job.name,userId:job.data.userId,content:content,eventType:'delta'};
                  //const listners=await emitDeltaEvent(job,cdata);
                  //logger.debug(`Delta emit returns : ${listners}`)
                  await job.updateProgress({
                    event: 'delta',
                    content: {
                        id: job.id,
                        jobname: job.name,
                        userId: job.data.userId,
                        content: content,
                        eventType: 'delta'
                    }
                  })
                  // // Emit a delta event with the streamed content
                  // await webHookQueue.add(job.name, {
                  //   id: job.id,
                  //   jobname: job.name,
                  //   userId: job.data.userId,
                  //   content: content,
                  //   eventType: 'delta'
                  // },
                  // {
                  //   attempts: MAX_ATTEMPTS,
                  //   backoff: {type: "exponential", delay: BACK_OFF_DELAY}
                  // });
                }
              } catch (error) {
                logger.error(`Error processing streaming line: ${error.message}`);
                // Continue processing other lines even if one fails
              }
            });
            
            // Process the next chunk
            return processChunk();
          });
        }
        
        // Start processing chunks
        return processChunk();
      })
      .catch(error => {
        logger.error('Error in Ollama streaming:', error.message);
        reject(error);
      });
    });
  } catch (error) {
    logger.error('Error setting up Ollama streaming:', error.message);
    throw error;
  }
}

export default {
  name: 'ollama',
  description: 'Processes chat requests using Ollama',
  version: '1.0.0',
  author: 'System',
  
  async execute(job) {
    // Direct destructuring - no need for JSON.stringify/parse
    const {model, prompt, systemPrompt, max_tokens, userId, stream = false} = job.data;
    const queueName = job.queueQualifiedName.split(":")[1];
    const customQueueEvents = new QueueEvents(queueName,redisOptions);

    async function emitDeltaEvent(job,content) {
      return customQueueEvents.emit('delta',{
        jobId: job.id,
        data : {
          content:content
        }
      })
    }

    logger.debug(`Executing Job : ${job.id} : ${job.name} for ${userId} qQualifiedName : ${queueName}`);

    /// check for data from children if any expecting only one child to return some data as part of context
    /// if more than one child returns data we will ignore for now of just concatenate all data
    const childrenValues = await job.getChildrenValues(); // get it first {} implies no children
    const num_children = Object.keys(childrenValues).length

    let messages;
    let children;
    if (num_children) {
        logger.debug(`${job.name}: Number of children ${num_children}`);
        children = Object.entries(childrenValues).map(([k,v])=>({id:k,...v}));
        //logger.debug(`${job.name} : ${JSON.stringify(children)}`);
        /* for (let i=0;i<num_children;i++) {
          logger.debug(`${job.name} : ${i}} : ${JSON.stringify(children[i].result)}`);
        } */
        /* messages = [
          {role: "system", content: systemPrompt},
          {role: "user", content: prompt + children[0].result}
        ]; */
        messages = [
          {role: "system", content: systemPrompt},
          {role: "user", content: prompt + JSON.stringify(children)}
        ];
    } else {
        messages = [
          {role: "system", content: systemPrompt},
          {role: "user", content: prompt}
        ];
    }
    let content;
    let response;
    let usage;
    if (stream) {
      // Use streaming mode
      logger.debug(`Using streaming mode for job ${job.id}`);
      content = await sendChatStreaming(messages, model, max_tokens, job, emitDeltaEvent);
      logger.debug(`Streaming complete for job ${job.id}, content length: ${content.length}`);
    } else {
      // Use non-streaming mode
      job.updateProgress(10);
      logger.debug(`Using non-streaming mode for job ${job.id}`);
      response = await sendChat(messages, model, max_tokens);
      content = response.message.content
      delete response.message;
      usage = response;
    }
    job.updateProgress(100)
    // Send the final completed event
    if (num_children) {
      return {success:true,name:job.name,id:job.id, input:job.data,children:children,result:content, usage}
    }
    return {success:true,name:job.name,id:job.id,input:job.data,result:content,usage}
    /* return webHookQueue.add(job.name, {
      id: job.id,
      jobname: job.name,
      data:job.data,
      userId,
      result: content,
      eventType: 'completed'
    },
    {
      attempts: MAX_ATTEMPTS,
      backoff: {type: "exponential", delay: BACK_OFF_DELAY}
    }); */
  }
};