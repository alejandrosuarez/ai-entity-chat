import React from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Home, Bot } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export default function NotFound() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background GIF */}
      <div className="absolute inset-0 flex items-center justify-center">
        <Image
          src="https://cdn.dribbble.com/users/285475/screenshots/2083086/dribbble_1.gif"
          alt="404 Robot Background"
          width={800}
          height={600}
          className="object-contain"
          unoptimized
          priority
        />
      </div>
      
      {/* Floating content */}
      <div className="relative z-10 min-h-screen flex items-end justify-center p-4 pb-20">
        <Card className="w-full max-w-lg bg-white/10 dark:bg-gray-900/10 backdrop-blur-md border border-white/20 shadow-2xl" style={{marginTop: '201px'}}>
          <CardHeader className="text-center space-y-4">
            <div className="animate-bounce">
              <Bot className="mx-auto h-16 w-16 text-blue-500" />
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Oops! My circuits are confused 🤖
            </CardTitle>
            <CardDescription className="text-lg text-gray-900 font-medium bg-white/80 backdrop-blur-sm rounded-lg p-3 border border-gray-200">
              Looks like you've wandered into the digital void! Even my advanced AI algorithms can't locate this page. 
              Maybe it's hiding in another dimension... or maybe it just doesn't exist! 🚀
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center p-4 bg-white/90 backdrop-blur-sm rounded-lg border border-gray-200 shadow-lg">
              <Bot className="inline-block mr-2 h-5 w-5 text-blue-600" />
              <span className="text-gray-900 font-medium">
                Don't worry, I'll help you get back on track!
              </span>
            </div>
            <Link href="/es" className="block">
              <Button className="w-full h-12 text-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300">
                <Home className="mr-2 h-5 w-5" />
                Beam Me Home! 🏠
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
      
      {/* Floating particles effect */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-blue-400 rounded-full animate-pulse opacity-70" />
        <div className="absolute top-1/3 right-1/4 w-1 h-1 bg-purple-400 rounded-full animate-bounce opacity-60" style={{animationDelay: '1s'}} />
        <div className="absolute bottom-1/3 left-1/3 w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse opacity-50" style={{animationDelay: '2s'}} />
        <div className="absolute top-1/2 right-1/3 w-1 h-1 bg-pink-400 rounded-full animate-bounce opacity-60" style={{animationDelay: '0.5s'}} />
        <div className="absolute bottom-1/4 right-1/4 w-2 h-2 bg-indigo-400 rounded-full animate-pulse opacity-40" style={{animationDelay: '1.5s'}} />
      </div>
    </div>
  )
}
