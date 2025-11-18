"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Heart,
  Search,
  Bell,
  MessageCircle,
  Settings,
  Menu,
  X,
  Home,
  Users,
  Compass,
  History,
  Bookmark,
  Tag,
  Trophy,
  User,
  Plus,
  FolderPlus,
  Clock,
} from "lucide-react"
import Link from "next/link"

export function FeedHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [notifications] = useState(3) // Mock notification count

  return (
    <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/feed" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Heart className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">CauseConnect</span>
          </Link>

          {/* Search Bar - Desktop */}
          <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search causes, organizations, or people..." className="pl-10 bg-background/50" />
            </div>
          </div>

          {/* Navigation - Desktop */}
          <div className="hidden md:flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/feed">Feed</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/explore">Explore</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/my-causes">My Causes</Link>
            </Button>

            {/* Notifications */}
            <Button variant="ghost" size="sm" className="relative" asChild>
              <Link href="/notifications">
                <Bell className="w-4 h-4" />
                {notifications > 0 && (
                  <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center text-xs">
                    {notifications}
                  </Badge>
                )}
              </Link>
            </Button>

            {/* Messages */}
            <Button variant="ghost" size="sm" asChild>
              <Link href="/chat">
                <MessageCircle className="w-4 h-4" />
              </Link>
            </Button>

            {/* Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="p-1">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src="/placeholder.svg?height=32&width=32&text=You" />
                    <AvatarFallback>You</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64 bg-background text-foreground" align="end" sideOffset={8}>
                {/* Profile Section */}
                <div className="flex items-center gap-3 p-3 border-b border-border">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src="/placeholder.svg?height=40&width=40&text=You" />
                    <AvatarFallback>You</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="font-medium text-sm">Your Name</span>
                    <span className="text-xs text-muted-foreground">@username</span>
                  </div>
                </div>

                {/* Feed Navigation */}
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Feed Navigation
                  </DropdownMenuLabel>
                  <DropdownMenuItem asChild>
                    <Link href="/feed" className="flex items-center gap-2">
                      <Home className="w-4 h-4" />
                      For You
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/feed/following" className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Following
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/explore" className="flex items-center gap-2">
                      <Compass className="w-4 h-4" />
                      Explore
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/history" className="flex items-center gap-2">
                      <History className="w-4 h-4" />
                      History
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuGroup>

                <DropdownMenuSeparator />

                {/* Custom Feeds */}
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Custom Feeds
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="bg-background text-foreground">
                    <DropdownMenuItem asChild>
                      <Link href="/feeds/custom" className="flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        Custom Feed
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>

                {/* Network */}
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Network
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="bg-background text-foreground">
                    <DropdownMenuItem asChild>
                      <Link href="/squads/find" className="flex items-center gap-2">
                        <Search className="w-4 h-4" />
                        Find Squads
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/squads/new" className="flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        New Squad
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>

                {/* Bookmarks */}
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="flex items-center gap-2">
                    <Bookmark className="w-4 h-4" />
                    Bookmarks
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="bg-background text-foreground">
                    <DropdownMenuItem asChild>
                      <Link href="/bookmarks/quick-saves" className="flex items-center gap-2">
                        <Bookmark className="w-4 h-4" />
                        Quick saves
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/bookmarks/read-later" className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Read it later
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/bookmarks/new-folder" className="flex items-center gap-2">
                        <FolderPlus className="w-4 h-4" />
                        New folder
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>

                {/* Discover */}
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="flex items-center gap-2">
                    <Compass className="w-4 h-4" />
                    Discover
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="bg-background text-foreground">
                    <DropdownMenuItem asChild>
                      <Link href="/discover/tags" className="flex items-center gap-2">
                        <Tag className="w-4 h-4" />
                        Tags
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/discover/leaderboard" className="flex items-center gap-2">
                        <Trophy className="w-4 h-4" />
                        Leaderboard
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>

                <DropdownMenuSeparator />

                {/* User Options */}
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    User Options
                  </DropdownMenuLabel>
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      View Profile
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Settings */}
            <Button variant="ghost" size="sm" asChild>
              <Link href="/settings">
                <Settings className="w-4 h-4" />
              </Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <Button variant="ghost" size="sm" className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-border py-4">
            <div className="space-y-4">
              {/* Mobile Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search causes..." className="pl-10 bg-background/50" />
              </div>

              {/* Mobile Navigation */}
              <div className="flex flex-col space-y-2">
                <Button variant="ghost" className="justify-start" asChild>
                  <Link href="/feed">Feed</Link>
                </Button>
                <Button variant="ghost" className="justify-start" asChild>
                  <Link href="/explore">Explore</Link>
                </Button>
                <Button variant="ghost" className="justify-start" asChild>
                  <Link href="/my-causes">My Causes</Link>
                </Button>
                <Button variant="ghost" className="justify-start" asChild>
                  <Link href="/notifications">
                    <Bell className="w-4 h-4 mr-2" />
                    Notifications
                    {notifications > 0 && <Badge className="ml-auto">{notifications}</Badge>}
                  </Link>
                </Button>
                <Button variant="ghost" className="justify-start" asChild>
                  <Link href="/chat">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Messages
                  </Link>
                </Button>
                <Button variant="ghost" className="justify-start" asChild>
                  <Link href="/profile">
                    <Avatar className="w-4 h-4 mr-2">
                      <AvatarImage src="/placeholder.svg?height=16&width=16&text=You" />
                      <AvatarFallback>You</AvatarFallback>
                    </Avatar>
                    Profile
                  </Link>
                </Button>
                <Button variant="ghost" className="justify-start" asChild>
                  <Link href="/settings">
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
