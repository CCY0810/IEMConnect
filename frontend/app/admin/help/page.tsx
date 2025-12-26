"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Search,
  ChevronDown,
  ChevronRight,
  Shield,
  X,
  ArrowLeft,
} from "lucide-react";
import AdminSidebar from "@/components/AdminSidebar";
import NotificationBell from "@/components/NotificationBell";
import UserAvatar from "@/components/UserAvatar";
import {
  helpCategories,
  searchHelp,
  HelpCategory,
  HelpQuestion,
} from "@/lib/helpData";

export default function HelpCentrePage() {
  const router = useRouter();
  const { user, token } = useAuth();
  const [hasMounted, setHasMounted] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(["getting-started"])
  );
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(
    new Set()
  );

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Search results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return null;
    return searchHelp(searchQuery);
  }, [searchQuery]);

  // Filter categories based on admin status (show all if admin, filter admin-only if not)
  const filteredCategories = useMemo(() => {
    return helpCategories.map((category) => ({
      ...category,
      questions: category.questions.filter(
        (q) => !q.adminOnly || isAdmin
      ),
    })).filter(category => category.questions.length > 0);
  }, [isAdmin]);

  // Toggle category
  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  // Toggle question
  const toggleQuestion = (questionId: string) => {
    setExpandedQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(questionId)) {
        next.delete(questionId);
      } else {
        next.add(questionId);
      }
      return next;
    });
  };

  // Clear search
  const clearSearch = () => {
    setSearchQuery("");
  };

  // Protect page - only check after component has mounted on client
  if (!hasMounted) {
    return <div className="flex min-h-screen bg-slate-900 items-center justify-center"><div className="text-white">Loading...</div></div>;
  }

  if (!token) {
    router.push("/login");
    return null;
  }

  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-slate-900 text-slate-100">
      {/* Sidebar */}
      <AdminSidebar activePage="help" />

      {/* Main Content */}
      <div className="flex-1 min-h-screen">
        {/* Header */}
        <header className="flex items-center justify-between px-8 py-4 sticky top-0 z-40 bg-white/10 backdrop-blur-xl shadow-lg border-b border-white/20">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white">
              Help Centre
            </h2>
            <p className="text-sm text-slate-300">
              Find answers to common questions and learn how to use IEM Connect
            </p>
          </div>

          <div className="flex items-center gap-5">
            <NotificationBell />
            <div className="text-right hidden sm:block">
              <div className="text-sm font-semibold text-white">{user.name}</div>
              <div className="text-xs text-slate-400 capitalize">{user.role}</div>
            </div>
            <button
              onClick={() => router.push("/profile")}
              className="rounded-full overflow-hidden border-2 border-transparent shadow hover:ring-2 hover:ring-indigo-500 transition-all cursor-pointer"
              title="View Profile"
            >
              <UserAvatar size="md" />
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="p-8 max-w-5xl mx-auto">
          {/* Search Bar */}
          <div className="relative mb-8">
            <Search
              size={20}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <Input
              type="text"
              placeholder="Search help articles... (e.g., 'attendance', 'register', 'feedback')"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-12 py-6 text-lg bg-slate-800 border-slate-700 text-white placeholder:text-slate-400 focus:ring-indigo-500 focus:border-indigo-500"
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            )}
          </div>

          {/* Search Results */}
          {searchResults !== null ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">
                  Search Results ({searchResults.length})
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSearch}
                  className="text-slate-400 hover:text-white"
                >
                  <ArrowLeft size={16} className="mr-2" />
                  Back to Categories
                </Button>
              </div>

              {searchResults.length === 0 ? (
                <Card className="bg-slate-800 border-slate-700">
                  <CardContent className="p-6 text-center">
                    <p className="text-slate-400">
                      No results found for "{searchQuery}"
                    </p>
                    <p className="text-sm text-slate-500 mt-2">
                      Try different keywords or browse the categories below
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {searchResults
                    .filter((q) => !q.adminOnly || isAdmin)
                    .map((question) => (
                      <QuestionCard
                        key={question.id}
                        question={question}
                        isExpanded={expandedQuestions.has(question.id)}
                        onToggle={() => toggleQuestion(question.id)}
                      />
                    ))}
                </div>
              )}
            </div>
          ) : (
            /* Categories */
            <div className="space-y-6">
              {filteredCategories.map((category) => (
                <CategorySection
                  key={category.id}
                  category={category}
                  isExpanded={expandedCategories.has(category.id)}
                  onToggle={() => toggleCategory(category.id)}
                  expandedQuestions={expandedQuestions}
                  onToggleQuestion={toggleQuestion}
                />
              ))}
            </div>
          )}

          {/* Admin Notice */}
          {isAdmin && (
            <div className="mt-12 p-4 bg-indigo-900/30 border border-indigo-700 rounded-lg">
              <div className="flex items-center gap-3">
                <Shield size={20} className="text-indigo-400" />
                <div>
                  <p className="text-sm font-medium text-indigo-300">
                    Admin Access
                  </p>
                  <p className="text-xs text-indigo-400">
                    You're viewing all help articles including admin-only content
                    marked with green badges.
                  </p>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

/**
 * Category Section Component
 */
function CategorySection({
  category,
  isExpanded,
  onToggle,
  expandedQuestions,
  onToggleQuestion,
}: {
  category: HelpCategory;
  isExpanded: boolean;
  onToggle: () => void;
  expandedQuestions: Set<string>;
  onToggleQuestion: (id: string) => void;
}) {
  return (
    <Card className="bg-slate-800 border-slate-700 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full p-6 flex items-center justify-between text-left hover:bg-slate-700/50 transition-colors"
      >
        <div className="flex items-center gap-4">
          <span className="text-3xl">{category.icon}</span>
          <div>
            <h3 className="text-xl font-bold text-white">{category.title}</h3>
            <p className="text-sm text-slate-400">{category.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-500">
            {category.questions.length} articles
          </span>
          {isExpanded ? (
            <ChevronDown size={24} className="text-slate-400" />
          ) : (
            <ChevronRight size={24} className="text-slate-400" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="px-6 pb-6 space-y-3">
          {category.questions.map((question) => (
            <QuestionCard
              key={question.id}
              question={question}
              isExpanded={expandedQuestions.has(question.id)}
              onToggle={() => onToggleQuestion(question.id)}
            />
          ))}
        </div>
      )}
    </Card>
  );
}

/**
 * Question Card Component
 */
function QuestionCard({
  question,
  isExpanded,
  onToggle,
}: {
  question: HelpQuestion;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="bg-slate-700/50 rounded-lg overflow-hidden border border-slate-600">
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-700 transition-colors"
      >
        <div className="flex items-center gap-3 flex-1">
          <span className="font-medium text-white">{question.question}</span>
          {question.adminOnly && (
            <Badge className="bg-emerald-600 text-white text-xs shrink-0">
              Admin Only
            </Badge>
          )}
        </div>
        {isExpanded ? (
          <ChevronDown size={20} className="text-slate-400 shrink-0 ml-4" />
        ) : (
          <ChevronRight size={20} className="text-slate-400 shrink-0 ml-4" />
        )}
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 pt-0">
          <div className="prose prose-invert prose-sm max-w-none">
            <div className="text-slate-300 whitespace-pre-line leading-relaxed">
              {question.answer}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
