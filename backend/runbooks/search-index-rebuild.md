# Operational Runbook: Search Index Failure & Rebuild

## 1. Symptoms
- Search queries return empty results, outdated results, or HTTP 500 errors.
- New published knowledge objects do not appear in student search.
- Search service/vector index is unresponsive or corrupted.

## 2. Detection
- Prometheus Alert: `SearchLatencyHigh` or `SearchErrorRateHigh`.
- Teacher reports that published lesson is missing from search results.

## 3. Immediate Action
1. **Verify Navigation Fallback**:
   - Confirm that curriculum-based navigation (Subject $\to$ Topic $\to$ Knowledge Object) and learning paths continue working.
   - Core learning invariant: Search index is a derived read model; losing search does not lose canonical knowledge.
2. **Check Index Worker**:
   - Check if the search indexing worker is running and whether indexing events are queued in the outbox.

## 4. Diagnosis
1. **Index Corruption vs Network Partition**:
   - Check Elasticsearch / Meilisearch / Vector DB connection and cluster health.
2. **Unpublished Leaks Check**:
   - Ensure the search index only includes `status: 'PUBLISHED'` versions.

## 5. Recovery (Full Rebuild Procedure)
Because search is strictly derived from canonical PostgreSQL records, the index can be safely and completely rebuilt from scratch:

1. **Purge Corrupted Index**:
   ```bash
   curl -X DELETE "$SEARCH_ENDPOINT/indexes/knowledge_objects"
   ```
2. **Trigger Full Reindex**:
   - Execute the reindexing script/worker:
     ```bash
     npm run reindex:knowledge
     ```
   - The worker iterates through all `KnowledgeObject` records with `status: 'PUBLISHED'` and their published versions, recalculating chunks/embeddings and bulk-loading the search index.
3. **Validate Index Health**:
   - Query a known published concept:
     ```bash
     curl "$SEARCH_ENDPOINT/indexes/knowledge_objects/search?q=Linear+Equations"
     ```

## 6. Post-Incident
- Verify search query latency returns to normal ($< 150$ms).
- Confirm zero unpublished or draft versions exist in the rebuilt index.
