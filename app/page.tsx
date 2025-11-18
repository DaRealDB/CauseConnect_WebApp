import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Heart, Users, Globe, ArrowRight, Star, TrendingUp } from "lucide-react"
import Link from "next/link"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/10">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Heart className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold text-foreground">CauseConnect</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-muted-foreground hover:text-foreground transition-colors">
              Sign In
            </Link>
            <Button asChild>
              <Link href="/register">Get Started</Link>
            </Button>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold text-balance mb-6 bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
            Connect with causes that matter
          </h1>
          <p className="text-xl text-muted-foreground text-balance mb-8 max-w-2xl mx-auto">
            Discover, support, and engage with charitable causes in your community and around the world. Make a real
            difference with every connection.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="text-lg px-8" asChild>
              <Link href="/register">
                Start Making Impact
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 bg-transparent" asChild>
              <Link href="/explore">Explore Causes</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Impact Stats */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <Card className="text-center p-8 border-0 shadow-lg bg-card/80 backdrop-blur-sm">
            <CardContent className="p-0">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-primary" />
              </div>
              <div className="text-3xl font-bold text-foreground mb-2">50K+</div>
              <div className="text-muted-foreground">Active supporters</div>
            </CardContent>
          </Card>
          <Card className="text-center p-8 border-0 shadow-lg bg-card/80 backdrop-blur-sm">
            <CardContent className="p-0">
              <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Globe className="w-8 h-8 text-accent" />
              </div>
              <div className="text-3xl font-bold text-foreground mb-2">1,200+</div>
              <div className="text-muted-foreground">Causes supported</div>
            </CardContent>
          </Card>
          <Card className="text-center p-8 border-0 shadow-lg bg-card/80 backdrop-blur-sm">
            <CardContent className="p-0">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-primary" />
              </div>
              <div className="text-3xl font-bold text-foreground mb-2">$2.5M</div>
              <div className="text-muted-foreground">Funds raised</div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-foreground mb-4">How CauseConnect works</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Simple, transparent, and impactful. Connect with causes in three easy steps.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <Card className="p-8 border-0 shadow-lg bg-card/80 backdrop-blur-sm">
            <CardContent className="p-0">
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mb-6">
                <span className="text-xl font-bold text-primary-foreground">1</span>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-4">Discover Causes</h3>
              <p className="text-muted-foreground">
                Browse through verified charitable causes and organizations making real impact in communities worldwide.
              </p>
            </CardContent>
          </Card>

          <Card className="p-8 border-0 shadow-lg bg-card/80 backdrop-blur-sm">
            <CardContent className="p-0">
              <div className="w-12 h-12 bg-accent rounded-lg flex items-center justify-center mb-6">
                <span className="text-xl font-bold text-accent-foreground">2</span>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-4">Connect & Engage</h3>
              <p className="text-muted-foreground">
                Follow causes you care about, engage with their updates, and connect with like-minded supporters.
              </p>
            </CardContent>
          </Card>

          <Card className="p-8 border-0 shadow-lg bg-card/80 backdrop-blur-sm">
            <CardContent className="p-0">
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mb-6">
                <span className="text-xl font-bold text-primary-foreground">3</span>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-4">Make Impact</h3>
              <p className="text-muted-foreground">
                Support causes through donations, volunteering, or spreading awareness to create lasting change.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <Card className="max-w-4xl mx-auto p-12 text-center border-0 shadow-xl bg-gradient-to-r from-primary/5 to-accent/5 backdrop-blur-sm">
          <CardContent className="p-0">
            <Star className="w-16 h-16 text-primary mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-foreground mb-4">Ready to make a difference?</h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join thousands of changemakers who are already creating positive impact through CauseConnect.
            </p>
            <Button size="lg" className="text-lg px-8" asChild>
              <Link href="/register">
                Join CauseConnect Today
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-12 border-t border-border">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center gap-2 mb-4 md:mb-0">
            <div className="w-6 h-6 bg-primary rounded-md flex items-center justify-center">
              <Heart className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold text-foreground">CauseConnect</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="/about" className="hover:text-foreground transition-colors">
              About
            </Link>
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">
              Terms
            </Link>
            <Link href="/contact" className="hover:text-foreground transition-colors">
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
