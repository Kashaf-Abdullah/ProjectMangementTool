import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import {
  FiActivity,
  FiCheckSquare,
  FiMessageSquare,
  FiMessageCircle,
  FiPaperclip,
  FiBriefcase,
  FiAtSign
} from 'react-icons/fi';
import { useRealtime } from '../../context/RealtimeContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import '../../styles/pages/collaboration.css';

const FILTER_TABS = [
  { id: 'all', label: 'All Activity' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'comments', label: 'Comments & @Mentions' },
  { id: 'discussions', label: 'Discussions' },
  { id: 'files', label: 'Files' },
  { id: 'projects', label: 'Projects & Team' }
];

const ActivityFeed = ({ fixedProjectId = null, compactLimit = null }) => {
  const { subscribe } = useRealtime();
  const [activities, setActivities] = useState([]);
  const [projects, setProjects] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [category, setCategory] = useState('all');
  const [projectFilter, setProjectFilter] = useState(fixedProjectId || 'all');
  const [actorFilter, setActorFilter] = useState('all');

  useEffect(() => {
    fetchActivities();
  }, [fixedProjectId, category, projectFilter, actorFilter]);

  useEffect(() => {
    if (!fixedProjectId && !compactLimit) {
      Promise.all([api.get('/projects'), api.get('/users?activeOnly=true')])
        .then(([projRes, usrRes]) => {
          setProjects(Array.isArray(projRes.data) ? projRes.data : []);
          setMembers(Array.isArray(usrRes.data) ? usrRes.data : []);
        })
        .catch(() => {});
    }
  }, [fixedProjectId, compactLimit]);

  useEffect(() => {
    const unsub = subscribe('activity:new', (evt) => {
      const act = evt.activity;
      if (!act) return;
      if (fixedProjectId && (act.project?._id || act.projectId) !== fixedProjectId) {
        return;
      }
      setActivities((prev) =>
        prev.some((a) => a._id === act._id) ? prev : [act, ...prev]
      );
    });
    return unsub;
  }, [fixedProjectId, subscribe]);

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      const targetProj = fixedProjectId || projectFilter;
      if (targetProj && targetProj !== 'all') params.set('projectId', targetProj);
      if (actorFilter !== 'all') params.set('actorId', actorFilter);
      if (category !== 'all') params.set('category', category);
      if (compactLimit) params.set('limit', String(compactLimit));

      const res = await api.get(`/activities?${params.toString()}`);
      setActivities(Array.isArray(res.data) ? res.data : []);
    } catch {
      toast.error('Failed to load activity feed');
    } finally {
      setLoading(false);
    }
  };

  const getVisualMeta = (type) => {
    switch (type) {
      case 'mention':
        return { icon: <FiAtSign size={16} />, color: '#7c3aed' };
      case 'comment_added':
      case 'reply_added':
        return { icon: <FiMessageSquare size={16} />, color: '#2563eb' };
      case 'discussion_created':
      case 'discussion_replied':
        return { icon: <FiMessageCircle size={16} />, color: '#0891b2' };
      case 'file_uploaded':
        return { icon: <FiPaperclip size={16} />, color: '#10b981' };
      case 'project_created':
      case 'member_added':
        return { icon: <FiBriefcase size={16} />, color: '#6366f1' };
      default:
        return { icon: <FiCheckSquare size={16} />, color: '#f59e0b' };
    }
  };

  const getEntityHref = (act) => {
    if (act.type === 'file_uploaded') return '/files';
    if (act.discussionId && act.project?._id) {
      return `/projects/${act.project._id}?tab=discussions`;
    }
    if (act.taskId) {
      return act.project?._id ? `/tasks?project=${act.project._id}` : '/tasks';
    }
    if (act.project?._id) {
      return `/projects/${act.project._id}`;
    }
    return '/dashboard';
  };

  return (
    <div className="activity-feed-wrapper">
      {!fixedProjectId && !compactLimit && (
        <div className="page-header">
          <div>
            <h1>Activity Feed</h1>
            <p className="text-muted">
              Live audit trail across tasks, comments, @mentions, discussions, and shared files
            </p>
          </div>
        </div>
      )}

      {!compactLimit && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`btn btn-sm ${category === tab.id ? 'primary-btn' : 'secondary-btn'}`}
                onClick={() => setCategory(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {!fixedProjectId && (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <select
                className="filter-select"
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
              >
                <option value="all">All Projects</option>
                {projects.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name}
                  </option>
                ))}
              </select>

              <select
                className="filter-select"
                value={actorFilter}
                onChange={(e) => setActorFilter(e.target.value)}
              >
                <option value="all">All Team Members</option>
                {members.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.firstName} {m.lastName}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      <div className={compactLimit ? '' : 'activity-feed-container'}>
        {loading ? (
          <div className="text-muted" style={{ padding: '16px 0' }}>
            Loading activity stream...
          </div>
        ) : activities.length === 0 ? (
          <div className="empty-state" style={{ padding: '32px 16px' }}>
            <FiActivity className="empty-state-icon" />
            <h3>No matching activity yet</h3>
            <p>Actions across tasks, comments, discussions, and files appear here in real time.</p>
          </div>
        ) : (
          <div className="activity-timeline">
            {activities.map((act) => {
              const visual = getVisualMeta(act.type);
              const actorName = act.actor
                ? `${act.actor.firstName} ${act.actor.lastName}`.trim()
                : 'Team Member';

              return (
                <div key={act._id} className="activity-timeline-row">
                  <div
                    className="activity-badge-icon"
                    style={{
                      backgroundColor: `${visual.color}18`,
                      color: visual.color
                    }}
                  >
                    {visual.icon}
                  </div>

                  <div className="activity-row-body">
                    <div className="activity-headline">
                      <strong>{actorName}</strong> {act.action}{' '}
                      <Link to={getEntityHref(act)} className="activity-target-link">
                        "{act.targetTitle}"
                      </Link>
                    </div>

                    {act.snippet && !compactLimit && (
                      <div className="activity-snippet-box">{act.snippet}</div>
                    )}

                    <div className="activity-submeta">
                      {act.project?.name && (
                        <Link
                          to={`/projects/${act.project._id}`}
                          className="table-project-tag"
                          style={{ textDecoration: 'none', fontSize: '11.5px' }}
                        >
                          <span
                            className="project-dot"
                            style={{ backgroundColor: act.project.color || '#2563eb' }}
                          />
                          {act.project.name}
                        </Link>
                      )}
                      <span>
                        {formatDistanceToNow(new Date(act.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityFeed;
