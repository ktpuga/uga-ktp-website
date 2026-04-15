'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, Users, Calendar, Target, Award } from 'lucide-react';

const membershipData = [
  { month: 'Sep', members: 142 },
  { month: 'Oct', members: 145 },
  { month: 'Nov', members: 148 },
  { month: 'Dec', members: 150 },
  { month: 'Jan', members: 152 },
  { month: 'Feb', members: 156 },
];

const eventAttendanceData = [
  { event: 'GBM', attendance: 92 },
  { event: 'Tech Talk', attendance: 78 },
  { event: 'Social', attendance: 85 },
  { event: 'Workshop', attendance: 65 },
  { event: 'Service', attendance: 45 },
];

const engagementData = [
  { name: 'Highly Active', value: 35, color: 'bg-blue-900' },
  { name: 'Active', value: 45, color: 'bg-blue-600' },
  { name: 'Moderately Active', value: 15, color: 'bg-blue-300' },
  { name: 'Inactive', value: 5, color: 'bg-slate-300' },
];

const recruitmentData = [
  { semester: 'Fall 2024', pledges: 22, initiated: 20 },
  { semester: 'Spring 2025', pledges: 18, initiated: 17 },
  { semester: 'Fall 2025', pledges: 25, initiated: 24 },
  { semester: 'Spring 2026', pledges: 20, initiated: 19 },
];

const maxMembers = Math.max(...membershipData.map((d) => d.members));
const maxAttendance = 100;
const maxPledges = Math.max(...recruitmentData.map((d) => d.pledges));

export default function AdminAnalytics() {
  const [range, setRange] = useState('semester');

  return (
    <div className="relative space-y-6">
      {/* Ambient gradient blobs matching main site hero */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-[28rem] w-[28rem] rounded-full bg-gradient-to-br from-indigo-500 via-fuchsia-500 to-cyan-400 opacity-10 blur-[120px]" />
        <div className="absolute -bottom-32 right-0 h-[26rem] w-[26rem] rounded-full bg-gradient-to-tr from-cyan-400 via-indigo-500 to-fuchsia-500 opacity-10 blur-[110px]" />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-blue-900 mb-2">Analytics</h1>
          <p className="text-slate-600">Track chapter metrics and engagement</p>
        </div>
        <select
          value={range}
          onChange={(e) => setRange(e.target.value)}
          className="w-48 rounded-md border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="week">Last Week</option>
          <option value="month">Last Month</option>
          <option value="semester">This Semester</option>
          <option value="year">This Year</option>
        </select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Members', value: '156', trend: '+4 this month', icon: Users },
          { label: 'Avg. Attendance', value: '85%', trend: '+3% from last semester', icon: Calendar },
          { label: 'Events Hosted', value: '24', trend: '8 this month', icon: Target },
          { label: 'Retention Rate', value: '94%', trend: '+2% from last year', icon: Award },
        ].map(({ label, value, trend, icon: Icon }) => (
          <Card key={label} className="ring-1 ring-slate-100 shadow-sm hover:shadow-indigo-200/50 hover:-translate-y-0.5 transition-all duration-300">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-slate-600">{label}</CardTitle>
                <Icon className="w-4 h-4 text-blue-800" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900">{value}</div>
              <div className="flex items-center gap-1 mt-1 text-sm text-green-600">
                <TrendingUp className="w-3 h-3" />
                <span className="text-slate-500">{trend}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <Tabs defaultValue="membership" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="membership">Membership</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="recruitment">Recruitment</TabsTrigger>
        </TabsList>

        <TabsContent value="membership" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Membership Growth</CardTitle>
              <CardDescription>Active member count over the past 6 months</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-4 h-48">
                {membershipData.map((d) => (
                  <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs font-medium text-gray-700">{d.members}</span>
                    <div
                      className="w-full bg-blue-800 rounded-t"
                      style={{ height: `${(d.members / maxMembers) * 160}px` }}
                    />
                    <span className="text-xs text-gray-500">{d.month}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Event Attendance</CardTitle>
              <CardDescription>Average attendance % by event type</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {eventAttendanceData.map((d) => (
                <div key={d.event}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700">{d.event}</span>
                    <span className="text-gray-500">{d.attendance}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3">
                    <div
                      className="bg-blue-800 h-3 rounded-full"
                      style={{ width: `${(d.attendance / maxAttendance) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="engagement" className="mt-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Member Engagement</CardTitle>
                <CardDescription>Distribution of member activity levels</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {engagementData.map((d) => (
                  <div key={d.name}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-gray-700">{d.name}</span>
                      <span className="text-gray-500">{d.value}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-3">
                      <div className={`${d.color} h-3 rounded-full`} style={{ width: `${d.value}%` }} />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Engagement Insights</CardTitle>
                <CardDescription>Key metrics and recommendations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <h4 className="font-semibold text-green-900 mb-1">High Engagement</h4>
                  <p className="text-sm text-green-800">80% of members are active or highly active — exceeding our target of 75%</p>
                </div>
                <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <h4 className="font-semibold text-amber-900 mb-1">Re-engagement Needed</h4>
                  <p className="text-sm text-amber-800">5% of members are inactive. Consider reaching out with personalized engagement.</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-blue-900 mb-1">Recognition Opportunity</h4>
                  <p className="text-sm text-blue-800">35% highly active members could be candidates for leadership positions.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="recruitment" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Recruitment & Retention</CardTitle>
              <CardDescription>Pledge class size and initiation rates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {recruitmentData.map((d) => (
                  <div key={d.semester}>
                    <p className="text-sm font-medium text-gray-700 mb-2">{d.semester}</p>
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-500 w-16">Pledges</span>
                        <div className="flex-1 bg-slate-100 rounded-full h-3">
                          <div className="bg-blue-900 h-3 rounded-full" style={{ width: `${(d.pledges / maxPledges) * 100}%` }} />
                        </div>
                        <span className="text-xs font-medium w-6 text-right">{d.pledges}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-500 w-16">Initiated</span>
                        <div className="flex-1 bg-slate-100 rounded-full h-3">
                          <div className="bg-blue-500 h-3 rounded-full" style={{ width: `${(d.initiated / maxPledges) * 100}%` }} />
                        </div>
                        <span className="text-xs font-medium w-6 text-right">{d.initiated}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
