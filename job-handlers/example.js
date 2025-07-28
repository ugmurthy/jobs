import { StorageManager } from 'promptdb-storage';
import path from 'path';

async function main() {
  // Initialize the storage manager with a custom directory
  const storage = new StorageManager(path.resolve('./my-prompts'));

  // Set a new prompt
  console.log('Setting a new prompt...');
  const newPrompt = await storage.setPrompt('my-task', {
    content: 'This is the prompt content.',
    description: 'A test prompt.',
    tags: ['test', 'example'],
  });
  console.log('Prompt set:', newPrompt);

  // Get the prompt
  console.log('\nGetting the prompt...');
  const retrievedPrompt = await storage.getPrompt('my-task');
  console.log('Prompt retrieved:', retrievedPrompt);

  // List all prompts
  console.log('\nListing prompts...');
  const prompts = await storage.listPrompts();
  console.log('All prompts:', prompts);
}

main().catch(console.error);