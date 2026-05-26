export const MOCK_GRAPH_DATA = {
  nodes: [
    { data: { id: 'usr_1', label: 'Mohammad', type: 'user' } },
    { data: { id: 'agt_4', label: 'Flux', type: 'agent' } },
    { data: { id: 'agt_1', label: 'Aria', type: 'agent' } },
    { data: { id: 'proj_1', label: 'Q3 Feature Release', type: 'project' } },
    { data: { id: 'ws_1', label: 'Engineering', type: 'workspace' } },
    { data: { id: 'task_1', label: 'Design API schema', type: 'task' } },
    { data: { id: 'task_2', label: 'DB migrations', type: 'task' } },
  ],
  edges: [
    { data: { id: 'e1', source: 'usr_1', target: 'ws_1', label: 'member_of' } },
    { data: { id: 'e2', source: 'ws_1', target: 'proj_1', label: 'contains' } },
    { data: { id: 'e3', source: 'proj_1', target: 'task_1', label: 'has_task' } },
    { data: { id: 'e4', source: 'proj_1', target: 'task_2', label: 'has_task' } },
    { data: { id: 'e5', source: 'agt_4', target: 'task_2', label: 'assigned_to' } },
    { data: { id: 'e6', source: 'agt_1', target: 'ws_1', label: 'operates_in' } },
  ],
}
