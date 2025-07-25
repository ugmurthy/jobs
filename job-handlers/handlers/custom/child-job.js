export default {
  name: 'child-job',
  description: 'A simple child job that returns a value.',
  version: '1.0.1',
  author: 'Kilo Code',
  data: {
    type: 'object',
    properties: {
      message: { type: 'string' },
      userId: { type: 'number' },
    },
  },

  async execute(job) {
    console.log(`Executing child-job with data: ${JSON.stringify(job.data)}`);

    const childrenValues = await job.getChildrenValues();
    console.log('CHILDREN RESULTS IN Child ', JSON.stringify(childrenValues));
    const children = Object.entries(childrenValues).map(([k, v]) => ({ id: k, ...v }));

    let jobResult;
    if (children.length === 0) {
      jobResult = { data: job.data };
    } else {
      jobResult = {
        data: { ...job.data, children },
      };
    }

    return {
      id: job.id,
      input: job.data,
      children,
      result: jobResult,
    };
  },
};