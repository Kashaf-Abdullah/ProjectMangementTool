import React from 'react';
import { Link } from 'react-router-dom';
import ActivityFeed from '../activity/ActivityFeed';
import '../../styles/pages/dashboard.css';

const RecentActivity = () => {
  return (
    <div className="recent-activity">
      <ActivityFeed compactLimit={6} />
      <div className="activity-footer" style={{ marginTop: '12px' }}>
        <Link to="/activity" className="view-all-link">
          View full live activity feed →
        </Link>
      </div>
    </div>
  );
};

export default RecentActivity;
