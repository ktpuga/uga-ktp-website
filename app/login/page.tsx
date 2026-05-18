'use client';

import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (role: 'member' | 'alumni' | 'admin') => {
    // Mock login - in production this would authenticate with backend
    if (role === 'member') {
      router.push('/member');
    } else if (role === 'alumni') {
      router.push('/alumni');
    } else {
      router.push('/admin');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 mb-4">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-xl">
              <span className="text-blue-900 text-3xl font-bold">ΚΘΠ</span>
            </div>
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
          <p className="text-blue-100">Sign in to access your portal</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <Tabs defaultValue="member" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="member">Member</TabsTrigger>
              <TabsTrigger value="alumni">Alumni</TabsTrigger>
              <TabsTrigger value="admin">Admin</TabsTrigger>
            </TabsList>

            <TabsContent value="member">
              <form onSubmit={(e) => { e.preventDefault(); handleLogin('member'); }} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="member-email">Email</Label>
                  <Input
                    id="member-email"
                    type="email"
                    placeholder="member@ktpgeorgia.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="member-password">Password</Label>
                  <Input
                    id="member-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full bg-blue-900 hover:bg-blue-800">
                  Sign In as Member
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="alumni">
              <form onSubmit={(e) => { e.preventDefault(); handleLogin('alumni'); }} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="alumni-email">Email</Label>
                  <Input
                    id="alumni-email"
                    type="email"
                    placeholder="alumni@ktpgeorgia.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="alumni-password">Password</Label>
                  <Input
                    id="alumni-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full bg-blue-900 hover:bg-blue-800">
                  Sign In as Alumni
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="admin">
              <form onSubmit={(e) => { e.preventDefault(); handleLogin('admin'); }} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="admin-email">Admin Email</Label>
                  <Input
                    id="admin-email"
                    type="email"
                    placeholder="admin@ktpgeorgia.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-password">Admin Password</Label>
                  <Input
                    id="admin-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full bg-blue-900 hover:bg-blue-800">
                  Sign In as Admin
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="mt-6 text-center">
            <a href="#" className="text-sm text-blue-900 hover:underline">
              Forgot your password?
            </a>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link href="/" className="text-sm text-white hover:underline">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
