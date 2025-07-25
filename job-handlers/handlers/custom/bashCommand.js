import { exec } from 'child_process';
import { promisify } from 'util';
import {logger} from '@ugm/logger'

const execAsync = promisify(exec);

export default {
  name: 'bashCommand',
  description: 'Executes a bash command and returns stdout/stderr output.',
  version: '1.0.1',
  author: 'Custom Handler',
  data: {
    type: 'object',
    properties: {
      command: { type: 'string', description: 'The bash command to execute.' },
      timeout: { type: 'number', description: 'Execution timeout in milliseconds.' },
    },
    required: ['command'],
  },

  async execute(job) {
    const childrenValues = await job.getChildrenValues();
    const children = Object.entries(childrenValues).map(([k, v]) => ({ id: k, ...v }));

    try {
      logger.info('Executing Bash Command Handler');

      if (!job.data || !job.data.command) {
        throw new Error('No command provided in job.data.command');
      }

      const { command, timeout } = job.data;
      logger.info(`Executing command: ${command}`);

      const { stdout, stderr } = await execAsync(command, {
        timeout: timeout || 30000, // Default 30-second timeout
        maxBuffer: 1024 * 1024 * 10, // 10MB buffer limit
      });

      await job.updateProgress(100);
      logger.info(`Command executed successfully: ${command}`);

      return {
        id: job.id,
        input: job.data,
        name:job.name,
        children,
        result: {
          success: true,
          output: `\n${stdout}${stderr ? `\nErrors:\n${stderr}` : ''}`,
        },
      };
    } catch (error) {
      logger.error(`Error executing command: ${error.message}`);
      return {
        id: job.id,
        input: job.data,
        name:job.name,
        children,
        result: {
          success: false,
          error: error.message,
        },
      };
    }
  },
};