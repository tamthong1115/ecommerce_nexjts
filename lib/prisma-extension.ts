import { Prisma } from '@prisma/client';
import { getTraceContext } from './request-context';

const AUDITED_MODELS = ['Shop', 'Product', 'Order'];
const SOFT_DELETE_MODELS = ['Shop', 'Product', 'User'];
const AUDIT_FIELDS_MODELS = ['Shop', 'Product']; // Models with createdById, updatedById

export const auditAndSoftDeleteExtension = Prisma.defineExtension((client) => {
  return client.$extends({
    query: {
      $allModels: {
        async findMany({ model, operation, args, query }) {
          if (SOFT_DELETE_MODELS.includes(model)) {
            args.where = { deletedAt: null, ...args.where };
          }
          return query(args);
        },
        async findFirst({ model, operation, args, query }) {
          if (SOFT_DELETE_MODELS.includes(model)) {
            args.where = { deletedAt: null, ...args.where };
          }
          return query(args);
        },
        async create({ model, operation, args, query }) {
          const ctx = getTraceContext();
          const userId = ctx?.userId;
          
          if (userId && AUDIT_FIELDS_MODELS.includes(model)) {
            if (!(args.data as any).createdById) {
              (args.data as any).createdById = userId;
            }
            if (!(args.data as any).updatedById) {
              (args.data as any).updatedById = userId;
            }
          }

          const result = await query(args);

          if (AUDITED_MODELS.includes(model)) {
            await (client as any).actionLog.create({
              data: {
                actorId: ctx?.userId,
                actionType: 'CREATE',
                actionSource: ctx?.actionSource || 'API',
                actionCode: `CREATE_${model.toUpperCase()}`,
                targetTable: model,
                targetId: (result as any).id,
                newData: JSON.parse(JSON.stringify(result)),
                actorIp: ctx?.ip,
                userAgent: ctx?.userAgent
              }
            });
          }

          return result;
        },
        async update({ model, operation, args, query }) {
          const ctx = getTraceContext();
          const userId = ctx?.userId;

          if (userId && AUDIT_FIELDS_MODELS.includes(model)) {
            if (!(args.data as any).updatedById) {
              (args.data as any).updatedById = userId;
            }
          }

          let oldData = null;
          if (AUDITED_MODELS.includes(model)) {
            // Fetch old data before update
            const modelDelegate = (client as any)[model.charAt(0).toLowerCase() + model.slice(1)];
            if (modelDelegate && modelDelegate.findUnique) {
               oldData = await modelDelegate.findUnique({
                 where: args.where
               });
            }
          }

          const result = await query(args);

          if (AUDITED_MODELS.includes(model)) {
            await (client as any).actionLog.create({
              data: {
                actorId: ctx?.userId,
                actionType: 'UPDATE',
                actionSource: ctx?.actionSource || 'API',
                actionCode: `UPDATE_${model.toUpperCase()}`,
                targetTable: model,
                targetId: (result as any).id,
                oldData: oldData ? JSON.parse(JSON.stringify(oldData)) : undefined,
                newData: JSON.parse(JSON.stringify(result)),
                actorIp: ctx?.ip,
                userAgent: ctx?.userAgent
              }
            });
          }

          return result;
        },
        async delete({ model, operation, args, query }) {
          const ctx = getTraceContext();
          const hasSoftDelete = SOFT_DELETE_MODELS.includes(model);
          
          let oldData = null;
          if (AUDITED_MODELS.includes(model)) {
            const modelDelegate = (client as any)[model.charAt(0).toLowerCase() + model.slice(1)];
            if (modelDelegate && modelDelegate.findUnique) {
               oldData = await modelDelegate.findUnique({
                 where: args.where
               });
            }
          }

          let result;
          if (hasSoftDelete) {
            // Perform soft delete
            const modelDelegate = (client as any)[model.charAt(0).toLowerCase() + model.slice(1)];
            result = await modelDelegate.update({
              where: args.where,
              data: { 
                deletedAt: new Date(),
                ...(AUDIT_FIELDS_MODELS.includes(model) && ctx?.userId ? { updatedById: ctx.userId } : {})
              }
            });
          } else {
            result = await query(args);
          }

          if (AUDITED_MODELS.includes(model)) {
            await (client as any).actionLog.create({
              data: {
                actorId: ctx?.userId,
                actionType: 'DELETE',
                actionSource: ctx?.actionSource || 'API',
                actionCode: `DELETE_${model.toUpperCase()}`,
                targetTable: model,
                targetId: (result as any).id,
                oldData: oldData ? JSON.parse(JSON.stringify(oldData)) : undefined,
                actorIp: ctx?.ip,
                userAgent: ctx?.userAgent
              }
            });
          }

          return result;
        }
      }
    }
  });
});