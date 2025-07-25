export default {
  name: 'parent-job',
  description: 'A parent job that processes return values from its children.',
  version: '1.0.1',
  author: 'Kilo Code',
  data: {}, // No specific data schema for the parent job itself

  async execute(job) {
    console.log('Executing parent-job...');

    const childrenValues = await job.getChildrenValues();
    const children = Object.entries(childrenValues).map(([k, v]) => ({ id: k, ...v }));

    console.log('Parent job finished.');

    return {
      success:true,
      id: job.id,
      input: job.data,
      children,
      result: {
        finalResult: 'All children processed.',
        processedData: children,
      },
    };
  },
};
