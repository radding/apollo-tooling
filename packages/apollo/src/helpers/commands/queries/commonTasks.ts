import { ListrTask } from "listr";

import {
  loadQueryDocuments,
  extractOperationsAndFragments,
  combineOperationsAndFragments
} from "apollo-codegen-core/lib/loading";

import { resolveDocumentSets } from "../../../config";

type ErrorLogger = (message: string) => void;

const taskResolveDocumentSets = (): ListrTask => ({
  title: "Resolving GraphQL document sets",
  task: async ctx => {
    ctx.documentSets = await resolveDocumentSets(ctx.config, false);
  }
});

const taskScanForOperations = ({ flags }: { flags: any }): ListrTask => ({
  title: "Scanning for GraphQL queries",
  task: async (ctx, task) => {
    ctx.queryDocuments = loadQueryDocuments(
      ctx.documentSets[0].documentPaths,
      flags.tagName
    );
    task.title = `Scanning for GraphQL queries (${
      ctx.queryDocuments.length
    } found)`;
  }
});

const taskIsolateOperationsAndFragments = ({
  errorLogger
}: {
  errorLogger?: ErrorLogger;
}): ListrTask => ({
  title: "Isolating operations and fragments",
  task: async ctx => {
    const { fragments, operations } = extractOperationsAndFragments(
      ctx.queryDocuments,
      errorLogger
    );
    ctx.fragments = fragments;
    ctx.operations = operations;
  }
});

const taskCombineOperationsAndFragments = ({
  errorLogger
}: {
  errorLogger?: ErrorLogger;
}): ListrTask => ({
  title: "Combining operations and fragments",
  task: async ctx => {
    ctx.fullOperations = combineOperationsAndFragments(
      ctx.operations,
      ctx.fragments,
      errorLogger
    );
  }
});

export function getCommonTasks({
  flags,
  errorLogger
}: {
  flags: any;
  errorLogger?: ErrorLogger;
}): ListrTask[] {
  return [
    taskResolveDocumentSets(),
    taskScanForOperations({ flags }),
    taskIsolateOperationsAndFragments({ errorLogger }),
    taskCombineOperationsAndFragments({ errorLogger })
  ];
}