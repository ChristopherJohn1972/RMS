import React, { useState } from 'react';
import {
  Ticket, Clock, AlertTriangle, CheckCircle, User,
  Edit3, Trash2, Zap, UserPlus, Circle, Home,
} from 'lucide-react';

const priorityConfig = {
  Urgent: { bg: 'bg-red-50', text: 'text-red-700', ring: 'ring-red-600/20', dot: 'bg-red-400' },
  High: { bg: 'bg-orange-50', text: 'text-orange-700', ring: 'ring-orange-600/20', dot: 'bg-orange-400' },
  Medium: { bg: 'bg-yellow-50', text: 'text-yellow-700', ring: 'ring-yellow-600/20', dot: 'bg-yellow-400' },
  Low: { bg: 'bg-gray-50', text: 'text-gray-700', ring: 'ring-gray-500/20', dot: 'bg-gray-400' },
};

const statusConfig = {
  Pending: { bg: 'bg-amber-50', text: 'text-amber-700', ring: 'ring-amber-600/20', icon: Clock },
  'In Progress': { bg: 'bg-blue-50', text: 'text-blue-700', ring: 'ring-blue-600/20', icon: AlertTriangle },
  Resolved: { bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-600/20', icon: CheckCircle },
};

const MaintenanceCard = ({ request, canManage, onStartProgress, onAssignStaff, onMarkResolved, onEdit, onDelete }) => {
  const [expanded, setExpanded] = useState(false);
  const r = request;
  const priority = priorityConfig[r.priority] || priorityConfig.Medium;
  const status = statusConfig[r.status] || statusConfig.Pending;
  const StatusIcon = status.icon;

  const timelineEvents = [];

  if (r.createdAt) {
    timelineEvents.push({
      icon: Circle,
      iconColor: 'text-red-400',
      iconBg: 'bg-red-50',
      label: 'Reported',
      detail: r.title,
      date: r.createdAt,
    });
  }

  if (r.status === 'In Progress' || r.status === 'Resolved') {
    timelineEvents.push({
      icon: AlertTriangle,
      iconColor: 'text-blue-400',
      iconBg: 'bg-blue-50',
      label: 'In Progress',
      detail: r.assignedTo ? `Assigned to ${r.assignedTo}` : 'Work started',
      date: r.createdAt,
    });
  }

  if (r.status === 'Resolved') {
    timelineEvents.push({
      icon: CheckCircle,
      iconColor: 'text-emerald-400',
      iconBg: 'bg-emerald-50',
      label: 'Resolved',
      detail: 'Issue has been fixed',
      date: r.createdAt,
    });
  }

  if (r.status === 'Pending') {
    timelineEvents.push({
      icon: User,
      iconColor: 'text-gray-400',
      iconBg: 'bg-gray-100',
      label: 'Status',
      detail: r.assignedTo ? `Assigned to ${r.assignedTo}` : 'Unassigned',
      date: '',
    });
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-all">
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {r.ticketNumber && (
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700 ring-1 ring-inset ring-slate-200 shrink-0">
                <Ticket className="w-3.5 h-3.5" /> {r.ticketNumber}
              </span>
            )}
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {r.tenantName || 'Unknown Tenant'}
                {r.propertyName && <span className="font-normal text-gray-500"> &bull; {r.propertyName}{r.unitNumber ? ` ${r.unitNumber}` : ''}</span>}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${priority.bg} ${priority.text} ${priority.ring}`}>
              {r.priority}
            </span>
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${status.bg} ${status.text} ${status.ring}`}>
              <StatusIcon className="w-3 h-3" /> {r.status}
            </span>
          </div>
        </div>

        <div className="mt-4 ml-1">
          <div className="relative">
            <div className="absolute left-[11px] top-2 bottom-2 w-px bg-slate-200" />
            <div className="space-y-4">
              {timelineEvents.map((event, i) => {
                const EventIcon = event.icon;
                return (
                  <div key={i} className="relative flex items-start gap-3">
                    <div className={`relative z-10 flex items-center justify-center w-6 h-6 rounded-full ${event.iconBg} ring-4 ring-white`}>
                      <EventIcon className={`w-3.5 h-3.5 ${event.iconColor}`} />
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">{event.label}:</span>{' '}
                        <span className="text-gray-500">{event.detail}</span>
                      </p>
                      {event.date && (
                        <p className="text-xs text-gray-400 mt-0.5">{event.date}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {r.description && (
          <p className="text-sm text-gray-500 mt-4 pl-9">{r.description}</p>
        )}
      </div>

      <div className="border-t border-slate-100 px-5 py-3 flex flex-wrap items-center gap-2">
        {canManage && r.status === 'Pending' && (
          <>
            <button onClick={() => onStartProgress(r.id)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-500 transition-colors">
              <Zap className="w-3.5 h-3.5" /> Start Progress
            </button>
            {!r.assignedTo && (
              <button onClick={() => onAssignStaff(r.id)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition-colors">
                <UserPlus className="w-3.5 h-3.5" /> Assign Staff
              </button>
            )}
          </>
        )}
        {canManage && r.status === 'In Progress' && (
          <button onClick={() => onMarkResolved(r.id)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-500 transition-colors">
            <CheckCircle className="w-3.5 h-3.5" /> Mark Resolved
          </button>
        )}
        {!canManage && r.status === 'Pending' && (
          <span className="text-xs text-gray-400 flex items-center gap-1"><Clock className="w-3 h-3" /> Awaiting assignment</span>
        )}
        {canManage && (
          <>
            <button onClick={() => onEdit(r)}
              className="ml-auto inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors">
              <Edit3 className="w-3 h-3" /> Edit
            </button>
            <button onClick={() => onDelete(r.id)}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-400 hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition-colors">
              <Trash2 className="w-3 h-3" /> Delete
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default MaintenanceCard;
