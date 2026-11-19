import mongoose from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

function httpError(message: string, status: number) {
  return Object.assign(new Error(message), { status });
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (!isObject(input)) throw httpError('Invalid activity', 400);

  const { userId, teamId, type, minutes } = input;
  if (
    typeof userId !== 'string'
    || typeof teamId !== 'string'
    || typeof type !== 'string'
    || typeof minutes !== 'number'
    || !mongoose.Types.ObjectId.isValid(userId)
    || !mongoose.Types.ObjectId.isValid(teamId)
  ) {
    throw httpError('Invalid activity input', 400);
  }

  const [user, team] = await Promise.all([
    User.findById(userId).lean(),
    Team.findById(teamId).lean(),
  ]);
  if (!user || !team) throw httpError('User or team not found', 404);

  const activity = new Activity({
    user: userId,
    team: teamId,
    type,
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
  await activity.validate();
  return activity.save();
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!isObject(input) || typeof input.name !== 'string' || input.name.trim() === '') {
    throw httpError('Team name is required', 400);
  }
  if (typeof input.mascot !== 'string' || input.mascot.trim() === '') {
    throw httpError('Team mascot is required', 400);
  }

  const members = input.members === undefined ? [] : input.members;
  if (
    !Array.isArray(members)
    || members.some((member) => typeof member !== 'string' || !mongoose.Types.ObjectId.isValid(member))
  ) {
    throw httpError('Invalid team members', 400);
  }

  const team = new Team({
    name: input.name,
    mascot: input.mascot,
    members,
  });
  await team.validate();
  return team.save();
}

export async function getLeaderboard() {
  const totals = await Activity.aggregate([
    { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    { $sort: { totalPoints: -1, _id: 1 } },
  ]);

  const teams = await Team.find({
    _id: { $in: totals.map((entry) => entry._id) },
  }).lean();
  const teamNames = new Map(teams.map((team) => [team._id.toString(), team.name]));

  return totals.map((entry, index) => ({
    teamName: teamNames.get(entry._id.toString()) ?? 'Unknown team',
    totalPoints: entry.totalPoints,
    rank: index + 1,
  }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail.trim().toLowerCase() }).lean();
  if (!user) throw httpError('User not found', 404);

  const recentActivity = await Activity.findOne({ user: user._id }).sort({ occurredAt: -1 }).lean();
  const recentFocus = recentActivity?.type?.toString();
  const focus = recentFocus === 'strength'
    ? 'strength'
    : user.fitnessGoal || recentFocus || '';

  const preferred = focus
    ? await Workout.findOne({ focus }).lean()
    : null;
  const suggestion = preferred ?? await Workout.findOne().lean();
  if (!suggestion) return [];

  const reason = recentActivity
    ? `Recommended for your recent ${recentActivity.type} activity and ${focus} goal`
    : `Recommended for your ${focus} fitness goal`;

  return [{ ...suggestion, reason }];
}

export { User };
