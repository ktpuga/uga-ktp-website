'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const TABS = ['member', 'alumni', 'admin'];

export default function Login() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('member');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (role) => {
    if (role === 'member') {
      router.push('/member');
    } else if (role === 'alumni') {
      router.push('/alumni');
    } else {
      router.push('/admin');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white-700 via-white-800 to-white-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-xl">
              <span className="text-blue-900 text-2xl font-bold">ΚΘΠ</span>
            </div>
          </Link>
          <h1 className="text-3xl font-bold text-black mb-2">Welcome Back</h1>
          <p className="text-black-100">Sign in to access your portal</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Tab List */}
          <div className="grid grid-cols-3 gap-1 bg-slate-100 rounded-lg p-1 mb-6">
            {TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`py-2 text-sm font-medium rounded-md transition-colors capitalize ${
                  activeTab === tab
                    ? 'bg-white text-blue-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleLogin(activeTab);
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                {activeTab === 'admin' ? 'Admin Email' : 'Email'}
              </label>
              <Input
                id="email"
                type="email"
                placeholder={`${activeTab}@ktpgeorgia.com`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                {activeTab === 'admin' ? 'Admin Password' : 'Password'}
              </label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-blue-900 hover:bg-blue-800 text-white capitalize"
            >
              Sign In as {activeTab}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <a href="#" className="text-sm text-blue-900 hover:underline">
              Forgot your password?
            </a>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link href="/" className="text-sm text-black hover:underline">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
