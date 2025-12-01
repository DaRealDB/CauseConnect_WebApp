"use client"

import { useState, useEffect } from "react"
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
  User as UserIcon,
  Plus,
  FolderPlus,
  Clock,
  LogOut,
  Target,
} from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from "next/navigation"
import { notificationService, userService, squadService } from "@/lib/api/services"
import type { User, Squad } from "@/lib/api/types"
import { getImageUrl } from "@/lib/utils"
import { ChatBadge } from "@/components/chat/ChatBadge"

interface FeedHeaderProps {
  searchQuery?: string
  onSearchChange?: (value: string) => void
}

export function FeedHeader({ searchQuery: externalSearchQuery, onSearchChange: externalOnSearchChange }: FeedHeaderProps = {}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [searchUsers, setSearchUsers] = useState<User[]>([])
  const [searchSquads, setSearchSquads] = useState<Squad[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [internalSearchQuery, setInternalSearchQuery] = useState("")
  const { user, logout } = useAuth()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  // Use external search query if provided, otherwise use internal state
  const searchQuery = externalSearchQuery !== undefined ? externalSearchQuery : internalSearchQuery
  const handleSearchChange = externalOnSearchChange || ((value: string) => setInternalSearchQuery(value))

  useEffect(() => {
    setMounted(true)

    const fetchUnreadCount = async () => {
      try {
        const response = await notificationService.getUnreadCount()
        setUnreadCount(response.count)
      } catch (error) {
        // Silently fail - user might not be authenticated
        setUnreadCount(0)
      }
    }
    fetchUnreadCount()
    // Poll every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000)
    return () => clearInterval(interval)
  }, [])

  // Search users and squads when search query changes
  useEffect(() => {
    const searchDebounced = async () => {
      if (searchQuery && searchQuery.trim().length > 0) {
        setIsSearching(true)
        try {
          const [users, squads] = await Promise.all([
            userService.searchUsers(searchQuery, 5).catch(() => []),
            squadService.searchSquads(searchQuery, 5).catch(() => []),
          ])
          setSearchUsers(users)
          setSearchSquads(squads)
        } catch (error) {
          setSearchUsers([])
          setSearchSquads([])
        } finally {
          setIsSearching(false)
        }
      } else {
        setSearchUsers([])
        setSearchSquads([])
      }
    }

    const timeoutId = setTimeout(searchDebounced, 300)
    return () => clearTimeout(timeoutId)
  }, [searchQuery])

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  // To avoid hydration mismatches, use stable placeholders on the server and first client render,
  // then switch to actual user-derived values only after the component has mounted.
  const displayName = mounted
    ? user?.name || `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || user?.username || "User"
    : "User"

  const displayUsername = mounted && user?.username ? `@${user.username}` : "@username"

  const avatarSrc = mounted && user?.avatar ? getImageUrl(user.avatar) : undefined

  const initials = mounted
    ? user?.firstName?.[0] || user?.username?.[0] || "U"
    : "U"

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
              <Input 
                placeholder="Search causes, organizations, people, or squads..." 
                className="pl-10 bg-background/50"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                  onClick={() => handleSearchChange("")}
                >
                  <X className="w-3 h-3" />
                </Button>
              )}
              {/* Search Results Dropdown */}
              {searchQuery && (searchUsers.length > 0 || searchSquads.length > 0) && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
                  <div className="p-2">
                    {/* People Results */}
                    {searchUsers.length > 0 && (
                      <>
                        <div className="text-xs font-semibold text-muted-foreground px-2 py-1 mb-1">People</div>
                        {searchUsers.map((user) => (
                          <Link
                            key={user.id}
                            href={`/profile/${user.username}`}
                            className="flex items-center gap-3 p-2 rounded hover:bg-secondary transition-colors"
                            onClick={() => handleSearchChange("")}
                          >
                            <Avatar className="w-10 h-10">
                              <AvatarImage src={getImageUrl(user.avatar)} />
                              <AvatarFallback>
                                {user.name
                                  ?.split(" ")
                                  .map((n: string) => n[0])
                                  .join("") || user.username?.[0] || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm text-foreground truncate">
                                  {user.name || user.username}
                                </span>
                                {user.verified && (
                                  <Badge variant="secondary" className="text-xs px-1">✓</Badge>
                                )}
                              </div>
                              <span className="text-xs text-muted-foreground">@{user.username}</span>
                            </div>
                          </Link>
                        ))}
                      </>
                    )}
                    
                    {/* Squads Results */}
                    {searchSquads.length > 0 && (
                      <>
                        {searchUsers.length > 0 && <div className="border-t border-border my-2" />}
                        <div className="text-xs font-semibold text-muted-foreground px-2 py-1 mb-1">Squads</div>
                        {searchSquads.map((squad) => (
                          <Link
                            key={squad.id}
                            href={`/squads/${squad.id}/discussion`}
                            className="flex items-center gap-3 p-2 rounded hover:bg-secondary transition-colors"
                            onClick={() => handleSearchChange("")}
                          >
                            <Avatar className="w-10 h-10">
                              <AvatarImage src={getImageUrl(squad.avatar)} />
                              <AvatarFallback>{squad.name[0]}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm text-foreground truncate">
                                  {squad.name}
                                </span>
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {squad.members} {squad.members === 1 ? "member" : "members"}
                              </span>
                            </div>
                          </Link>
                        ))}
                      </>
                    )}
                  </div>
                </div>
              )}
              
              {/* Loading indicator */}
              {searchQuery && isSearching && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-lg z-50 p-4">
                  <p className="text-sm text-muted-foreground text-center">Searching...</p>
                </div>
              )}
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
                {unreadCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center text-xs">
                    {unreadCount}
                  </Badge>
                )}
              </Link>
            </Button>

            {/* Messages */}
            <Button variant="ghost" size="sm" className="relative" asChild>
              <Link href="/chat">
                <MessageCircle className="w-4 h-4" />
                <ChatBadge />
              </Link>
            </Button>

            {/* Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="p-1">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={avatarSrc} />
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64 bg-background text-foreground" align="end" sideOffset={8}>
                {/* Profile Section */}
                <div className="flex items-center gap-3 p-3 border-b border-border">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={avatarSrc} />
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="font-medium text-sm">{displayName}</span>
                    <span className="text-xs text-muted-foreground">{displayUsername}</span>
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
                    <Link href="/squads" className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Squads
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
                  <DropdownMenuItem asChild>
                    <Link href="/my-causes" className="flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      My Causes
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuGroup>

                <DropdownMenuSeparator />

                {/* Custom Feeds */}
                <DropdownMenuItem asChild>
                  <Link href="/custom-feeds" className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Custom Feeds
                  </Link>
                </DropdownMenuItem>

                {/* Squads */}
                <DropdownMenuItem asChild>
                  <Link href="/squads" className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Squads
                  </Link>
                </DropdownMenuItem>

                {/* Bookmarks */}
                <DropdownMenuItem asChild>
                  <Link href="/bookmarks" className="flex items-center gap-2">
                    <Bookmark className="w-4 h-4" />
                    Bookmarks
                  </Link>
                </DropdownMenuItem>

                {/* Muted Posts */}
                <DropdownMenuItem asChild>
                  <Link href="/muted-posts" className="flex items-center gap-2">
                    <History className="w-4 h-4" />
                    Muted Posts
                  </Link>
                </DropdownMenuItem>

                {/* Discover */}
                <DropdownMenuItem asChild>
                  <Link href="/discover" className="flex items-center gap-2">
                    <Compass className="w-4 h-4" />
                    Discover
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                {/* User Options */}
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    User Options
                  </DropdownMenuLabel>
                  <DropdownMenuItem asChild>
                    <Link href={user?.username ? `/profile/${user.username}` : "/profile"} className="flex items-center gap-2">
                      <UserIcon className="w-4 h-4" />
                      View Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="flex items-center gap-2">
                      <Settings className="w-4 h-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                    <LogOut className="w-4 h-4 mr-2" />
                    Log Out
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
                <Input 
                  placeholder="Search causes, people, or squads..." 
                  className="pl-10 bg-background/50"
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                    onClick={() => handleSearchChange("")}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                )}
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
                  <Link href="/muted-posts">Muted Posts</Link>
                </Button>
                <Button variant="ghost" className="justify-start" asChild>
                  <Link href="/notifications">
                    <Bell className="w-4 h-4 mr-2" />
                    Notifications
                    {unreadCount > 0 && <Badge className="ml-auto">{unreadCount}</Badge>}
                  </Link>
                </Button>
                <Button variant="ghost" className="justify-start" asChild>
                  <Link href="/chat">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Messages
                    <ChatBadge className="ml-auto" />
                  </Link>
                </Button>
                <Button variant="ghost" className="justify-start" asChild>
                  <Link href={user?.username ? `/profile/${user.username}` : "/profile"}>
                    <Avatar className="w-4 h-4 mr-2">
                      <AvatarImage src={avatarSrc} />
                      <AvatarFallback>{initials}</AvatarFallback>
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
                <Button variant="ghost" className="justify-start text-destructive" onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Log Out
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
