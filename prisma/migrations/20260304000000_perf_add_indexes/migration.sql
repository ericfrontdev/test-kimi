-- Performance: index for listNumber lookup on list creation
CREATE INDEX "project_lists_projectId_listNumber_idx" ON "project_lists"("projectId", "listNumber" DESC);

-- Performance: index for position lookup on item creation
CREATE INDEX "list_items_listId_position_idx" ON "list_items"("listId", "position" DESC);
