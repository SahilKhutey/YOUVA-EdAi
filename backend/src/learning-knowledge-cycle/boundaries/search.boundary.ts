/**
 * YOUVA-EdAI: Search Boundary (LKC-0)
 * 
 * Boundary Interface: Connects the Knowledge Cycle to the existing
 * content-intelligence and semantic search infrastructure.
 * 
 * Search queries are delegated to content-intelligence and return
 * canonical Knowledge IDs, avoiding a parallel search index.
 */

import { KnowledgeObjectType } from '../contracts/knowledge-object.contract';

export interface KnowledgeSearchQuery {
  tenantId: string;
  queryText: string;
  types?: KnowledgeObjectType[];
  subjectId?: string;
  topicId?: string;
  tags?: string[];
  limit?: number;
  offset?: number;
}

export interface KnowledgeSearchResultItem {
  canonicalKnowledgeId: string;
  type: KnowledgeObjectType;
  title: string;
  snippet: string;
  relevanceScore: number;
  tags: string[];
}

export interface ISearchBoundary {
  /**
   * Executes a search across canonical knowledge via content-intelligence.
   */
  searchKnowledge(
    query: KnowledgeSearchQuery,
  ): Promise<KnowledgeSearchResultItem[]>;
}
