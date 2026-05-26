export const MOCK_GRAPH_DATA = {
  nodes: [
    // Users
    { data: { id: 'usr_mh', label: 'MH', type: 'user', name: 'Mohammad (Admin)' } },
    { data: { id: 'usr_sa', label: 'SA', type: 'user', name: 'Sarah (Lead Designer)' } },
    { data: { id: 'usr_jd', label: 'JD', type: 'user', name: 'James (Dev)' } },
    
    // Agents
    { data: { id: 'agt_aria', label: 'Aria', type: 'agent', name: 'Aria (Ops)' } },
    { data: { id: 'agt_flux', label: 'Flux', type: 'agent', name: 'Flux (Dev)' } },
    { data: { id: 'agt_nova', label: 'Nova', type: 'agent', name: 'Nova (Finance)' } },
    
    // Projects
    { data: { id: 'proj_core', label: 'CORE', type: 'project', name: 'Core Refactor Q3' } },
    { data: { id: 'proj_api', label: 'API', type: 'project', name: 'API Gateway v2' } },
    { data: { id: 'proj_ui', label: 'UI', type: 'project', name: 'Dashboard Redesign' } },
    { data: { id: 'proj_db', label: 'DB', type: 'project', name: 'Database Cluster' } },
    
    // Tasks
    { data: { id: 'task_t1', label: 'T1', type: 'task', name: 'Refactor Core Memory' } },
    { data: { id: 'task_t2', label: 'T2', type: 'task', name: 'JWT Rotation' } },
    { data: { id: 'task_t3', label: 'T3', type: 'task', name: 'Stripe API Setup' } },
    { data: { id: 'task_t4', label: 'T4', type: 'task', name: 'Tailwind Config V4' } },
    { data: { id: 'task_t5', label: 'T5', type: 'task', name: 'Migration Script' } },
  ],
  edges: [
    // Project dependencies / connections
    { data: { id: 'e1', source: 'proj_core', target: 'proj_api', label: 'DEPENDS_ON', type: 'depends' } },
    { data: { id: 'e2', source: 'proj_api', target: 'proj_db', label: 'DEPENDS_ON', type: 'depends' } },
    { data: { id: 'e3', source: 'proj_ui', target: 'proj_core', label: 'DEPENDS_ON', type: 'depends' } },
    
    // Tasks -> Projects
    { data: { id: 'e4', source: 'proj_core', target: 'task_t1', label: 'HAS_TASK' } },
    { data: { id: 'e5', source: 'proj_core', target: 'task_t2', label: 'HAS_TASK' } },
    { data: { id: 'e6', source: 'proj_api', target: 'task_t3', label: 'HAS_TASK' } },
    { data: { id: 'e7', source: 'proj_ui', target: 'task_t4', label: 'HAS_TASK' } },
    { data: { id: 'e8', source: 'proj_db', target: 'task_t5', label: 'HAS_TASK' } },
    
    // Users -> Projects
    { data: { id: 'e9', source: 'usr_mh', target: 'proj_core', label: 'MEMBER_OF' } },
    { data: { id: 'e10', source: 'usr_sa', target: 'proj_ui', label: 'MEMBER_OF' } },
    { data: { id: 'e11', source: 'usr_jd', target: 'proj_api', label: 'MEMBER_OF' } },
    
    // Agents -> Projects / Tasks (Monitored/Assigned)
    { data: { id: 'e12', source: 'agt_flux', target: 'proj_core', label: 'MONITORED_BY', type: 'monitored' } },
    { data: { id: 'e13', source: 'agt_aria', target: 'proj_ui', label: 'MONITORED_BY', type: 'monitored' } },
    { data: { id: 'e14', source: 'agt_nova', target: 'task_t3', label: 'MONITORED_BY', type: 'monitored' } },
  ],
}
