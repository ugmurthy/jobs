import { FlowProducer } from 'bullmq';
import prisma from '../lib/prisma.js';
import redis from '../config/redis.js';
import { logger } from '@ugm/logger';
const flowProducer = new FlowProducer({ connection: redis });
const createFlowInDb = async (name, userId) => {
    return prisma.flow.create({
        data: {
            name,
            userId,
        },
    });
};
const createFlowJobInDb = async (flowId, job, jobNode) => {
    return prisma.flowJob.create({
        data: {
            jobId: jobNode.job.id,
            flowId: flowId,
            queueName: job.queueName,
            data: job.data || {},
            opts: job.opts || {},
            status: 'waiting',
            children: (job.children || []),
        },
    });
};
const processFlowJobs = async (jobs, userId) => {
    const processedJobs = [];
    logger.info(`flowService.ts : f(processFlowJobs) len(jobs): ${jobs.length}`);
    for (const jobData of jobs) {
        const children = jobData.children ? await processFlowJobs(jobData.children, userId) : undefined;
        logger.info(`\t name.       : ${jobData.name}`);
        logger.info(`\t Queue name. : ${jobData.queueName}`);
        logger.info(`\t jobData.data: ${JSON.stringify(jobData.data)}`);
        const bullJob = {
            name: jobData.name,
            queueName: jobData.queueName,
            data: { ...jobData.data, userId },
            opts: jobData.opts,
            children,
        };
        processedJobs.push(bullJob);
    }
    return processedJobs;
};
export const createFlow = async (flowData, userId) => {
    const { name, queueName, data, opts, children } = flowData;
    logger.info(`Creating flow "${name}" for user ${userId}`);
    const dbFlow = await createFlowInDb(name, userId);
    const flowId = dbFlow.id;
    const childJobs = children ? await processFlowJobs(children, userId) : undefined;
    const rootJob = {
        name: name,
        queueName: queueName,
        data: { ...data, userId },
        opts: opts,
        children: childJobs,
    };
    const flowNode = await flowProducer.add(rootJob);
    logger.info(`Added flow "${name}" (ID: ${flowNode.job.id}) to BullMQ.`);
    // Now, save all the jobs to the database
    // We need to traverse both the original job data and the resulting job node tree
    const saveJobsRecursive = async (jobDefs, jobNodes) => {
        for (let i = 0; i < jobDefs.length; i++) {
            const jobDef = jobDefs[i];
            const jobNode = jobNodes[i];
            await createFlowJobInDb(flowId, jobDef, jobNode);
            if (jobDef.children && jobNode.children) {
                await saveJobsRecursive(jobDef.children, jobNode.children);
            }
        }
    };
    await createFlowJobInDb(flowId, rootJob, flowNode);
    if (rootJob.children && flowNode.children) {
        await saveJobsRecursive(rootJob.children, flowNode.children);
    }
    return dbFlow;
};
export const getFlows = async () => {
    return prisma.flow.findMany();
};
export const getFlowById = async (id) => {
    return prisma.flow.findUnique({ where: { id } });
};
export const getFlowJobs = async (flowId) => {
    return prisma.flowJob.findMany({ where: { flowId } });
};
