module.exports = {
  ROLES: {
    STUDENT: 'student',
    FACULTY: 'faculty',
    CLUB_COORDINATOR: 'club_coordinator',
    MAINTENANCE_STAFF: 'maintenance_staff',
    TRANSPORT_STAFF: 'transport_staff',
    ADMIN: 'admin'
  },
  COMPLAINT_CATEGORIES: [
    'Wi-Fi',
    'Electrical',
    'Classroom',
    'Lab Equipment',
    'Water',
    'Cleanliness',
    'Hostel Maintenance',
    'Transport',
    'Infrastructure',
    'Other'
  ],
  COMPLAINT_STATUS: {
    OPEN: 'Open',
    ASSIGNED: 'Assigned',
    ACCEPTED: 'Accepted',
    IN_PROGRESS: 'In Progress',
    WAITING: 'Waiting',
    RESOLVED: 'Resolved',
    REOPENED: 'Reopened',
    CLOSED: 'Closed',
    REJECTED: 'Rejected'
  },
  COMPLAINT_PRIORITY: {
    LOW: 'Low',
    MEDIUM: 'Medium',
    HIGH: 'High',
    CRITICAL: 'Critical'
  },
  DEFAULT_SLA_HOURS: {
    Critical: 1,
    High: 4,
    Medium: 12,
    Low: 48
  },
  PROJECT_STATUS: {
    IDEA: 'Idea',
    RECRUITING: 'Recruiting',
    IN_DEVELOPMENT: 'In Development',
    TESTING: 'Testing',
    COMPLETED: 'Completed',
    ARCHIVED: 'Archived'
  },
  RESOURCE_TYPES: [
    'Notes',
    'PDF',
    'Presentation',
    'Useful Link',
    'Tutorial',
    'Question Paper',
    'Reference Material'
  ],
  EVENT_CATEGORIES: [
    'Hackathon',
    'Workshop',
    'Coding Contest',
    'Technical Fest',
    'Cultural Event',
    'Sports',
    'Seminar',
    'Club Event',
    'Competition'
  ],
  LOST_FOUND_CATEGORIES: [
    'Electronics',
    'ID Cards & Wallets',
    'Keys',
    'Books & Stationery',
    'Clothing & Accessories',
    'Bags',
    'Bottles',
    'Other'
  ],
  SUGGESTION_STATUS: {
    SUBMITTED: 'Submitted',
    UNDER_REVIEW: 'Under Review',
    PLANNED: 'Planned',
    IMPLEMENTED: 'Implemented',
    REJECTED: 'Rejected'
  }
};
