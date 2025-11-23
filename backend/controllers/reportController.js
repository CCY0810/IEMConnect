import { Op, Sequelize } from "sequelize";
import sequelize from "../config/database.js";
import User from "../models/User.js";
import Event from "../models/Event.js";
import EventRegistration from "../models/EventRegistration.js";
import Attendance from "../models/Attendance.js";
import { getCached } from "../utils/cache.js";

// Utility: get start and end dates for last N months including current
function getLastNMonths(n) {
  const months = [];
  const now = new Date();
  // Set to first day of current month
  const currentStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
  for (let i = 0; i < n; i++) {
    const start = new Date(
      currentStart.getFullYear(),
      currentStart.getMonth() - i,
      1,
      0,
      0,
      0
    );
    const end = new Date(
      start.getFullYear(),
      start.getMonth() + 1,
      0,
      23,
      59,
      59,
      999
    );
    months.unshift({
      key: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}`,
      start,
      end,
    });
  }
  return months;
}

// A. User & Faculty Insights
export const getUsersInsights = async (req, res) => {
  const startTime = Date.now();
  try {
    const data = await getCached('users-insights', async () => {
      const totalUsers = await User.count();

      // Last month cutoff: end of previous month
      const now = new Date();
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

      const lastMonthTotalUsers = await User.count({
        where: {
          createdAt: { [Op.lte]: endOfLastMonth },
        },
      });

      const growthPercent = lastMonthTotalUsers
        ? ((totalUsers - lastMonthTotalUsers) / lastMonthTotalUsers) * 100
        : 100; // If last month had 0, treat as 100% growth

      // Faculty distribution - optimized with aggregation
      const facultyDistribution = await User.findAll({
        attributes: [
          [sequelize.fn('COALESCE', sequelize.col('faculty'), 'Unknown'), 'faculty'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        ],
        group: ['faculty'],
        raw: true,
      });

      const facultyDist = facultyDistribution.reduce((acc, row) => {
        acc[row.faculty] = parseInt(row.count);
        return acc;
      }, {});

      // Verification queue
      const pendingApprovals = await User.count({ where: { is_verified: 0 } });

      return {
        total_users: totalUsers,
        last_month_total_users: lastMonthTotalUsers,
        growth_percent: Number(growthPercent.toFixed(2)),
        faculty_distribution: facultyDist,
        pending_approvals: pendingApprovals,
      };
    }, 300); // Cache for 5 minutes

    const duration = Date.now() - startTime;
    console.log(`[PERF] getUsersInsights took ${duration}ms`);
    if (duration > 1000) {
      console.warn(`[SLOW QUERY] getUsersInsights exceeded 1s: ${duration}ms`);
    }

    res.json(data);
  } catch (error) {
    console.error("Users insights error:", error);
    res.status(500).json({ error: "Failed to compute user insights" });
  }
};

// B. Event Operations
export const getEventOperations = async (req, res) => {
  const startTime = Date.now();
  try {
    const data = await getCached('event-operations', async () => {
      // Optimized: Single query with GROUP BY
      const statusCounts = await Event.findAll({
        attributes: [
          'status',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        ],
        group: ['status'],
        raw: true,
      });

      const statusFunnel = {
        Upcoming: 0,
        Open: 0,
        Completed: 0,
      };

      statusCounts.forEach(row => {
        if (statusFunnel.hasOwnProperty(row.status)) {
          statusFunnel[row.status] = parseInt(row.count);
        }
      });

      return {
        status_funnel: statusFunnel,
        total_events_held: statusFunnel.Completed,
      };
    }, 300); // Cache for 5 minutes

    const duration = Date.now() - startTime;
    console.log(`[PERF] getEventOperations took ${duration}ms`);
    if (duration > 1000) {
      console.warn(`[SLOW QUERY] getEventOperations exceeded 1s: ${duration}ms`);
    }

    res.json(data);
  } catch (error) {
    console.error("Event operations error:", error);
    res.status(500).json({ error: "Failed to compute event operations" });
  }
};

// C. Attendance & Engagement
export const getAttendanceEngagement = async (req, res) => {
  const startTime = Date.now();
  try {
    const data = await getCached('attendance-engagement', async () => {
      // Parallel execution of independent queries
      const [totalAttendees, totalRegistrations, methodStats, topPerformersRaw] = await Promise.all([
        // Total attendees
        Attendance.count(),
        
        // Total registrations
        EventRegistration.count({
          where: { status: { [Op.in]: ["registered", "attended"] } },
        }),
        
        // Method split - optimized with GROUP BY
        Attendance.findAll({
          attributes: [
            'method',
            [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
          ],
          group: ['method'],
          raw: true,
        }),
        
        // Top performers - optimized with aggregation
        Attendance.findAll({
          attributes: [
            [sequelize.fn('COUNT', sequelize.col('Attendance.id')), 'attendance_count'],
            [sequelize.col('registration.user.id'), 'user_id'],
            [sequelize.col('registration.user.name'), 'name'],
            [sequelize.col('registration.user.email'), 'email'],
            [sequelize.col('registration.user.matric_number'), 'matric_number'],
            [sequelize.col('registration.user.membership_number'), 'membership_number'],
            [sequelize.col('registration.user.faculty'), 'faculty'],
          ],
          include: [
            {
              model: EventRegistration,
              as: "registration",
              attributes: [],
              include: [
                {
                  model: User,
                  as: "user",
                  attributes: [],
                },
              ],
            },
          ],
          group: [
            sequelize.col('registration.user.id'),
            sequelize.col('registration.user.name'),
            sequelize.col('registration.user.email'),
            sequelize.col('registration.user.matric_number'),
            sequelize.col('registration.user.membership_number'),
            sequelize.col('registration.user.faculty'),
          ],
          order: [[sequelize.literal('attendance_count'), 'DESC']],
          limit: 5,
          raw: true,
        }),
      ]);

      const participationRate = totalRegistrations
        ? (totalAttendees / totalRegistrations) * 100
        : 0;

      // Process method split
      const methodCounts = {
        QR: 0,
        Code: 0,
        Manual: 0,
      };
      methodStats.forEach(row => {
        if (methodCounts.hasOwnProperty(row.method)) {
          methodCounts[row.method] = parseInt(row.count);
        }
      });
      const totalMethods = methodCounts.QR + methodCounts.Code + methodCounts.Manual;
      const methodSplit = {
        QR: totalMethods ? Number(((methodCounts.QR / totalMethods) * 100).toFixed(2)) : 0,
        Code: totalMethods ? Number(((methodCounts.Code / totalMethods) * 100).toFixed(2)) : 0,
        Manual: totalMethods ? Number(((methodCounts.Manual / totalMethods) * 100).toFixed(2)) : 0,
      };

      // Process top performers - handle potential null values
      const topPerformers = topPerformersRaw
        .filter(row => row.user_id) // Filter out null users
        .map((row) => ({
          user: {
            id: row.user_id,
            name: row.name || 'Unknown',
            email: row.email || '',
            matric_number: row.matric_number || '',
            membership_number: row.membership_number || '',
            faculty: row.faculty || 'Unknown',
          },
          attendance_count: parseInt(row.attendance_count) || 0,
        }));

      return {
        total_attendees: totalAttendees,
        total_registrations: totalRegistrations,
        participation_rate: Number(participationRate.toFixed(2)),
        method_split: methodSplit,
        top_performers: topPerformers,
      };
    }, 300); // Cache for 5 minutes

    const duration = Date.now() - startTime;
    console.log(`[PERF] getAttendanceEngagement took ${duration}ms`);
    if (duration > 1000) {
      console.warn(`[SLOW QUERY] getAttendanceEngagement exceeded 1s: ${duration}ms`);
    }

    res.json(data);
  } catch (error) {
    console.error("Attendance engagement error:", error);
    res.status(500).json({ error: "Failed to compute attendance engagement" });
  }
};

// Attendance by Faculty (bar chart)
export const getAttendanceByFaculty = async (req, res) => {
  const startTime = Date.now();
  try {
    const data = await getCached('attendance-by-faculty', async () => {
      // Optimized: Use aggregation query instead of loading all records
      const facultyData = await Attendance.findAll({
        attributes: [
          [sequelize.fn('COALESCE', sequelize.col('registration.user.faculty'), 'Unknown'), 'faculty'],
          [sequelize.fn('COUNT', sequelize.col('Attendance.id')), 'count'],
        ],
        include: [
          {
            model: EventRegistration,
            as: "registration",
            attributes: [],
            include: [
              {
                model: User,
                as: "user",
                attributes: [],
              },
            ],
          },
        ],
        group: ['registration.user.faculty'],
        raw: true,
      });

      const facultyCounts = {};
      facultyData.forEach(row => {
        facultyCounts[row.faculty || 'Unknown'] = parseInt(row.count);
      });

      return { attendance_by_faculty: facultyCounts };
    }, 300); // Cache for 5 minutes

    const duration = Date.now() - startTime;
    console.log(`[PERF] getAttendanceByFaculty took ${duration}ms`);
    if (duration > 1000) {
      console.warn(`[SLOW QUERY] getAttendanceByFaculty exceeded 1s: ${duration}ms`);
    }

    res.json(data);
  } catch (error) {
    console.error("Attendance by faculty error:", error);
    res.status(500).json({ error: "Failed to compute attendance by faculty" });
  }
};

// Registration vs Attendance over last N months (default 6)
export const getRegistrationsVsAttendance = async (req, res) => {
  const startTime = Date.now();
  try {
    const months = parseInt(req.query.months || "6", 10);
    const cacheKey = `registrations-vs-attendance-${months}`;
    
    const data = await getCached(cacheKey, async () => {
      const ranges = getLastNMonths(Math.max(1, Math.min(months, 24)));

      // Parallel execution for all months
      const series = await Promise.all(
        ranges.map(async (m) => {
          const [registrations, attendees] = await Promise.all([
            EventRegistration.count({
              where: {
                status: { [Op.in]: ["registered", "attended"] },
                registration_date: { [Op.between]: [m.start, m.end] },
              },
            }),
            Attendance.count({
              where: { marked_at: { [Op.between]: [m.start, m.end] } },
            }),
          ]);
          return { month: m.key, registrations, attendees };
        })
      );

      return { trend: series };
    }, 300); // Cache for 5 minutes

    const duration = Date.now() - startTime;
    console.log(`[PERF] getRegistrationsVsAttendance took ${duration}ms`);
    if (duration > 1000) {
      console.warn(`[SLOW QUERY] getRegistrationsVsAttendance exceeded 1s: ${duration}ms`);
    }

    res.json(data);
  } catch (error) {
    console.error("Registrations vs attendance error:", error);
    res.status(500).json({ error: "Failed to compute registrations vs attendance trend" });
  }
};

// Recent Activity: last 5 user registrations or check-ins
export const getRecentActivity = async (req, res) => {
  const startTime = Date.now();
  try {
    const data = await getCached('recent-activity', async () => {
      // Parallel execution
      const [recentUsers, recentAttendance] = await Promise.all([
        User.findAll({
          limit: 5,
          order: [["createdAt", "DESC"]],
          attributes: ["id", "name", "email", "faculty", "createdAt"],
        }),
        Attendance.findAll({
          limit: 5,
          order: [["marked_at", "DESC"]],
          include: [
            {
              model: EventRegistration,
              as: "registration",
              include: [
                { model: User, as: "user", attributes: ["id", "name", "email", "faculty"] },
                { model: Event, as: "event", attributes: ["id", "title"] },
              ],
            },
          ],
        }),
      ]);

      const activity = [
        ...recentUsers.map((u) => ({
          type: "user_registered",
          id: `user-${u.id}`,
          user: { id: u.id, name: u.name, email: u.email, faculty: u.faculty },
          timestamp: u.createdAt,
        })),
        ...recentAttendance.map((a) => ({
          type: "user_checked_in",
          id: `attendance-${a.id}`,
          user: {
            id: a.registration?.user?.id,
            name: a.registration?.user?.name,
            email: a.registration?.user?.email,
            faculty: a.registration?.user?.faculty,
          },
          event: { id: a.registration?.event?.id, title: a.registration?.event?.title },
          method: a.method,
          timestamp: a.marked_at,
        })),
      ]
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 5);

      return { recent_activity: activity };
    }, 60); // Cache for 1 minute (more frequent updates for recent activity)

    const duration = Date.now() - startTime;
    console.log(`[PERF] getRecentActivity took ${duration}ms`);
    if (duration > 1000) {
      console.warn(`[SLOW QUERY] getRecentActivity exceeded 1s: ${duration}ms`);
    }

    res.json(data);
  } catch (error) {
    console.error("Recent activity error:", error);
    res.status(500).json({ error: "Failed to fetch recent activity" });
  }
};

// Top Events by attendance count
export const getTopEvents = async (req, res) => {
  const startTime = Date.now();
  try {
    const data = await getCached('top-events', async () => {
      // Optimized: Use aggregation query with GROUP BY
      const topEventsRaw = await Attendance.findAll({
        attributes: [
          [sequelize.fn('COUNT', sequelize.col('Attendance.id')), 'attendance_count'],
          [sequelize.col('registration.event.id'), 'event_id'],
          [sequelize.col('registration.event.title'), 'event_title'],
          [sequelize.col('registration.event.start_date'), 'event_start_date'],
          [sequelize.col('registration.event.end_date'), 'event_end_date'],
        ],
        include: [
          {
            model: EventRegistration,
            as: "registration",
            attributes: [],
            include: [
              {
                model: Event,
                as: "event",
                attributes: [],
              },
            ],
          },
        ],
        group: [
          sequelize.col('registration.event.id'),
          sequelize.col('registration.event.title'),
          sequelize.col('registration.event.start_date'),
          sequelize.col('registration.event.end_date'),
        ],
        order: [[sequelize.literal('attendance_count'), 'DESC']],
        limit: 10,
        raw: true,
      });

      const topEvents = topEventsRaw.map((row) => ({
        event: {
          id: row.event_id,
          title: row.event_title,
          start_date: row.event_start_date,
          end_date: row.event_end_date,
        },
        attendance_count: parseInt(row.attendance_count),
      }));

      return { top_events: topEvents };
    }, 300); // Cache for 5 minutes

    const duration = Date.now() - startTime;
    console.log(`[PERF] getTopEvents took ${duration}ms`);
    if (duration > 1000) {
      console.warn(`[SLOW QUERY] getTopEvents exceeded 1s: ${duration}ms`);
    }

    res.json(data);
  } catch (error) {
    console.error("Top events error:", error);
    res.status(500).json({ error: "Failed to compute top events" });
  }
};