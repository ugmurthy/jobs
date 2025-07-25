


export default {
  name: 'myCustomJob',
  description: 'A demonstration handler that showcases custom handler functionality.',
  version: '1.0.1',
  author: 'U G Murthy',
  data: {
    type: 'object',
    properties: {
      userId: { type: 'number' },
    },
  },

  async execute(job) {
    const delay = (duration) => new Promise((resolve) => setTimeout(resolve, duration * 1000));

    console.log('Executing Custom Handler');

    for (let i = 0; i < 50; i++) {
      await job.updateProgress(i * 2);
      await delay(0.5);
    }

    await job.updateProgress(100);

    const resultPayload = `Received: ${job.id}/${job.name} from ${job.data.userId} with data: ${JSON.stringify(job.data, null, 2)}`;
    
    const childrenValues = await job.getChildrenValues();
    const children = Object.entries(childrenValues).map(([k, v]) => ({ id: k, ...v }));

    return {
      success:true,
      id: job.id,
      input: job.data,
      children,
      result: {
        message: resultPayload,
      },
    };
  },
};