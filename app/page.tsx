'use client';

import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Briefcase, Award, BookOpen, TrendingUp, Target, Handshake, GraduationCap, Mail, Phone, MapPin, ChevronRight } from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-gray-200 bg-white sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-900 to-blue-800 rounded-xl flex items-center justify-center shadow-md">
                <span className="text-white text-2xl font-bold">ΚΘΠ</span>
              </div>
              <div>
                <div className="text-xl font-bold text-blue-900">Kappa Theta Pi</div>
                <div className="text-xs text-gray-600">University of Georgia</div>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <a href="#about" className="hidden md:block text-sm font-medium text-gray-700 hover:text-blue-900 transition-colors">About</a>
              <a href="#pillars" className="hidden md:block text-sm font-medium text-gray-700 hover:text-blue-900 transition-colors">Pillars</a>
              <a href="#join" className="hidden md:block text-sm font-medium text-gray-700 hover:text-blue-900 transition-colors">Join</a>
              <a href="#contact" className="hidden md:block text-sm font-medium text-gray-700 hover:text-blue-900 transition-colors">Contact</a>
              <Link href="/login">
                <Button className="bg-blue-900 hover:bg-blue-800 shadow-md">Portal Login</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')]" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32 relative">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-block px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-sm font-medium mb-6 border border-white/20">
              America's Premier Professional Technology Fraternity
            </div>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              Building Tomorrow's
              <br />
              <span className="text-blue-200">Tech Leaders</span>
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 mb-10 max-w-3xl mx-auto leading-relaxed">
              Kappa Theta Pi is a co-ed professional technology fraternity that develops innovative, industry-ready professionals.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="#join">
                <Button size="lg" className="bg-white text-blue-900 hover:bg-blue-50 shadow-xl text-lg px-8 py-6">
                  Learn About Rush
                  <ChevronRight className="ml-2 w-5 h-5" />
                </Button>
              </a>
              <Link href="/login">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 text-lg px-8 py-6">
                  Member Portal
                </Button>
              </Link>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent" />
      </section>

      {/* Stats Bar */}
      <section className="py-12 bg-gray-50 border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-blue-900 mb-2">150+</div>
              <div className="text-sm text-gray-600 uppercase tracking-wide">Active Members</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-blue-900 mb-2">500+</div>
              <div className="text-sm text-gray-600 uppercase tracking-wide">Alumni</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-blue-900 mb-2">10+</div>
              <div className="text-sm text-gray-600 uppercase tracking-wide">Years at UGA</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-blue-900 mb-2">50+</div>
              <div className="text-sm text-gray-600 uppercase tracking-wide">Events Annually</div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-blue-900 mb-4">Who We Are</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              A community of passionate technologists committed to professional development, innovation, and lifelong brotherhood.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1">
              <h3 className="text-3xl font-bold text-blue-900 mb-6">Our Mission</h3>
              <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                Kappa Theta Pi connects students who are passionate about technology. We provide members with opportunities to develop professionally, network with industry leaders, and build lasting friendships.
              </p>
              <p className="text-lg text-gray-700 mb-8 leading-relaxed">
                Through professional development workshops, technical projects, networking events, and community service, we prepare our members to become leaders in the technology industry.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Award className="w-5 h-5 text-blue-900" />
                  </div>
                  <div>
                    <div className="font-semibold text-blue-900">Excellence</div>
                    <div className="text-sm text-gray-600">In all we do</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Users className="w-5 h-5 text-blue-900" />
                  </div>
                  <div>
                    <div className="font-semibold text-blue-900">Community</div>
                    <div className="text-sm text-gray-600">Building connections</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="order-1 md:order-2">
              <div className="rounded-2xl overflow-hidden shadow-2xl">
                  src="https://images.unsplash.com/photo-1758691737182-d42aefd6dee8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBidXNpbmVzcyUyMHN0dWRlbnRzJTIwbWVldGluZ3xlbnwxfHx8fDE3NzIzMjE5NDB8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                  alt="KTP members collaborating"
                  className="w-full h-96 object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Three Pillars Section */}
      <section id="pillars" className="py-20 md:py-28 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-blue-900 mb-4">Our Three Pillars</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything we do is built on professional development, technical advancement, and social growth.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-2 border-blue-100 hover:shadow-xl transition-shadow bg-white">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-900 to-blue-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Briefcase className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-2xl text-blue-900">Professional Development</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base text-gray-700 text-center leading-relaxed">
                  Build your career through workshops, tech talks, resume reviews, mock interviews, and mentorship from industry professionals and alumni.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-2 border-blue-100 hover:shadow-xl transition-shadow bg-white">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-900 to-blue-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <BookOpen className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-2xl text-blue-900">Technical Advancement</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base text-gray-700 text-center leading-relaxed">
                  Enhance your technical skills through collaborative projects, hackathons, coding workshops, and hands-on learning experiences.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-2 border-blue-100 hover:shadow-xl transition-shadow bg-white">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-900 to-blue-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-2xl text-blue-900">Social Growth</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base text-gray-700 text-center leading-relaxed">
                  Form lasting friendships through social events, retreats, community service, and a supportive brotherhood dedicated to your success.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Why Join Section */}
      <section className="py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-blue-900 mb-4">Why Join KTP?</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Become part of a network that will support you throughout your career
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Handshake className="w-6 h-6 text-blue-900" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-blue-900 mb-2">Industry Connections</h3>
                <p className="text-gray-600">Network with professionals from top tech companies and gain access to exclusive recruiting opportunities.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Target className="w-6 h-6 text-blue-900" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-blue-900 mb-2">Skill Development</h3>
                <p className="text-gray-600">Enhance your technical and professional skills through workshops, projects, and real-world experiences.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <GraduationCap className="w-6 h-6 text-blue-900" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-blue-900 mb-2">Mentorship</h3>
                <p className="text-gray-600">Learn from experienced alumni and upperclassmen who are invested in your personal and professional growth.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Users className="w-6 h-6 text-blue-900" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-blue-900 mb-2">Lifelong Brotherhood</h3>
                <p className="text-gray-600">Build meaningful relationships with like-minded individuals who share your passion for technology.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-6 h-6 text-blue-900" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-blue-900 mb-2">Leadership Opportunities</h3>
                <p className="text-gray-600">Take on leadership roles and develop skills that will set you apart in your career.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Award className="w-6 h-6 text-blue-900" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-blue-900 mb-2">Exclusive Resources</h3>
                <p className="text-gray-600">Access member-only resources, alumni network, and career development tools.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Join/Rush Section */}
      <section id="join" className="py-20 md:py-28 bg-gradient-to-br from-blue-900 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Join Kappa Theta Pi</h2>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              We're looking for motivated students passionate about technology and eager to grow professionally and socially.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-12 items-center max-w-5xl mx-auto">
            <div>
              <h3 className="text-2xl font-bold mb-6">Rush Information</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-700 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white font-bold">1</span>
                  </div>
                  <div>
                    <div className="font-semibold mb-1">Attend Info Sessions</div>
                    <div className="text-blue-100">Learn about KTP and meet current members at our rush events.</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-700 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white font-bold">2</span>
                  </div>
                  <div>
                    <div className="font-semibold mb-1">Submit Application</div>
                    <div className="text-blue-100">Complete our online application and share why you want to join KTP.</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-700 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white font-bold">3</span>
                  </div>
                  <div>
                    <div className="font-semibold mb-1">Interview Process</div>
                    <div className="text-blue-100">Meet with members one-on-one to discuss your interests and goals.</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-700 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white font-bold">4</span>
                  </div>
                  <div>
                    <div className="font-semibold mb-1">Receive Bid & Pledge</div>
                    <div className="text-blue-100">Join our pledge class and begin your journey to brotherhood.</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8">
              <h3 className="text-2xl font-bold mb-4">Interested in Rushing?</h3>
              <p className="text-blue-100 mb-6">
                Rush happens twice a year at the beginning of each semester. Fill out our interest form to stay updated on rush events and applications.
              </p>
              <Button size="lg" className="w-full bg-white text-blue-900 hover:bg-blue-50 text-lg py-6">
                Rush Interest Form
                <ChevronRight className="ml-2 w-5 h-5" />
              </Button>
              <div className="mt-6 pt-6 border-t border-white/20">
                <div className="text-sm text-blue-100 mb-2">Next Rush Period:</div>
                <div className="text-xl font-semibold">Fall 2026 - August</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Portal Access Section */}
      <section className="py-20 md:py-28 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-blue-900 mb-4">Portal Access</h2>
            <p className="text-xl text-gray-600">
              Members and alumni can access their dedicated portals
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="border-2 border-blue-100 hover:shadow-xl transition-shadow">
              <CardHeader className="text-center">
                <div className="w-14 h-14 bg-blue-900 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Users className="w-7 h-7 text-white" />
                </div>
                <CardTitle className="text-xl">Member Portal</CardTitle>
                <CardDescription>For active members</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600 mb-6">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-900 rounded-full" />
                    <span>Chapter calendar & events</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-900 rounded-full" />
                    <span>Files & photos</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-900 rounded-full" />
                    <span>Announcements</span>
                  </li>
                </ul>
                <Link href="/login">
                  <Button className="w-full bg-blue-900 hover:bg-blue-800">Access Portal</Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="border-2 border-blue-100 hover:shadow-xl transition-shadow">
              <CardHeader className="text-center">
                <div className="w-14 h-14 bg-blue-900 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <GraduationCap className="w-7 h-7 text-white" />
                </div>
                <CardTitle className="text-xl">Alumni Portal</CardTitle>
                <CardDescription>For KTP alumni</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600 mb-6">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-900 rounded-full" />
                    <span>Alumni directory</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-900 rounded-full" />
                    <span>Events & reunions</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-900 rounded-full" />
                    <span>Resources & networking</span>
                  </li>
                </ul>
                <Link href="/login">
                  <Button className="w-full bg-blue-900 hover:bg-blue-800">Access Portal</Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="border-2 border-blue-100 hover:shadow-xl transition-shadow">
              <CardHeader className="text-center">
                <div className="w-14 h-14 bg-blue-900 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-7 h-7 text-white" />
                </div>
                <CardTitle className="text-xl">Admin Portal</CardTitle>
                <CardDescription>For administrators</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600 mb-6">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-900 rounded-full" />
                    <span>Manage announcements</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-900 rounded-full" />
                    <span>Analytics & insights</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-900 rounded-full" />
                    <span>User management</span>
                  </li>
                </ul>
                <Link href="/login">
                  <Button className="w-full bg-blue-900 hover:bg-blue-800">Access Portal</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-blue-900 mb-4">Get In Touch</h2>
            <p className="text-xl text-gray-600">
              Have questions? We'd love to hear from you.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <Card className="text-center border-2 border-blue-100 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-7 h-7 text-blue-900" />
                </div>
                <h3 className="font-semibold text-blue-900 mb-2">Email</h3>
                <a href="mailto:contact@ktpgeorgia.com" className="text-gray-600 hover:text-blue-900 transition-colors">
                  contact@ktpgeorgia.com
                </a>
              </CardContent>
            </Card>

            <Card className="text-center border-2 border-blue-100 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <MapPin className="w-7 h-7 text-blue-900" />
                </div>
                <h3 className="font-semibold text-blue-900 mb-2">Location</h3>
                <p className="text-gray-600">
                  University of Georgia<br />
                  Athens, GA 30602
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border-2 border-blue-100 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Users className="w-7 h-7 text-blue-900" />
                </div>
                <h3 className="font-semibold text-blue-900 mb-2">Social Media</h3>
                <p className="text-gray-600">
                  Follow us on Instagram<br />
                  @ktpuga
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-blue-900 text-white py-12 border-t border-blue-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <span className="text-white text-2xl font-bold">ΚΘΠ</span>
              </div>
              <div>
                <div className="text-lg font-semibold">Kappa Theta Pi</div>
                <div className="text-sm text-blue-200">University of Georgia Chapter</div>
              </div>
            </div>
            <div className="text-center md:text-right text-sm text-blue-200">
              <p>© 2026 Kappa Theta Pi, University of Georgia</p>
              <p className="mt-1">Building the future of technology, together.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
