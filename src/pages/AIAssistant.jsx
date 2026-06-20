import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Send, Sparkles, MapPin, Clock, Save, RefreshCw, Plus, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import PageHeader from "../components/PageHeader";
import GlassCard from "../components/GlassCard";
import ReactMarkdown from "react-markdown";

const quickPrompts = [
  "Create a 3-day luxury itinerary in Bali",
  "Suggest hidden gems near my hotel",
  "Optimize my travel route",
  "Add family-friendly dinner options",
  "Suggest indoor alternatives if it rains",
  "Reduce total budget by 20%",
];

export default function AIAssistant() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const scrollRef = useRef(null);
  const urlParams = new URLSearchParams(window.location.search);
  const destination = urlParams.get("destination");

  useEffect(() => {
    if (destination && messages.length === 0) {
      setInput(`Create a luxury 5-day itinerary for ${destination}`);
    }
  }, [destination]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text) => {
    if (!text.trim()) return;
    const userMsg = { role: "user", content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
    const response = await base44.integrations.Core.InvokeLLM({
      prompt: `You are MORA's premium AI travel concierge. You help travelers plan luxurious, well-organized itineraries. 
      
When creating itineraries, format them beautifully with:
- Day numbers and dates
- Time slots
- Activity names with locations
- Brief descriptions
- Estimated costs
- Travel tips

Be elegant, helpful, and provide detailed travel recommendations.

User request: ${text}

${messages.length > 0 ? `Previous conversation context: ${messages.map(m => `${m.role}: ${m.content}`).join('\n')}` : ''}`,
      model: "gemini_3_flash",
      add_context_from_internet: true,
    });

    setMessages(prev => [...prev, { role: "assistant", content: response }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry — I couldn't reach the concierge just now. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToTrip = async (content) => {
    if (saving) return;
    setSaving(true);
    try {
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Extract the trip details from this itinerary text and return structured data:
      
${content}`,
      response_json_schema: {
        type: "object",
        properties: {
          title: { type: "string" },
          destination: { type: "string" },
          days: { type: "number" },
          activities: {
            type: "array",
            items: {
              type: "object",
              properties: {
                day: { type: "number" },
                time: { type: "string" },
                name: { type: "string" },
                location: { type: "string" },
                budget: { type: "number" },
                category: { type: "string" }
              }
            }
          }
        }
      }
    });

    const trip = await base44.entities.Trip.create({
      title: result.title || "AI Generated Trip",
      destination: result.destination || "Unknown",
      status: "draft",
      is_ai_generated: true,
      travelers: 1,
    });

    if (result.activities) {
      for (const act of result.activities) {
        await base44.entities.ItineraryItem.create({
          trip_id: trip.id,
          day_number: act.day || 1,
          time: act.time || "",
          activity_name: act.name,
          location: act.location || "",
          budget: act.budget || 0,
          category: act.category || "activity",
          booking_status: "not_booked",
        });
      }
    }

    toast.success("Saved to your trips");
    navigate(`/itinerary/${trip.id}`);
    } catch {
      toast.error("Couldn't save to trips. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="animate-fade-in flex flex-col" style={{ height: 'calc(100vh - 120px)' }}>
      <PageHeader 
        title="Smart-A Itinerary" 
        subtitle="AI-powered travel planning"
        showBack 
      />

      <div className="flex-1 overflow-y-auto px-6 space-y-4 hide-scrollbar pb-2">
        {messages.length === 0 && (
          <div className="pt-4">
            <div className="text-center mb-6">
              <div className="w-16 h-16 glass-gold rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-gold" />
              </div>
              <h2 className="text-lg font-display font-semibold text-mora-primary mb-1">
                Your AI Travel Concierge
              </h2>
              <p className="text-xs text-mora-neutral leading-relaxed max-w-[260px] mx-auto">
                I can create personalized itineraries, optimize routes, suggest hidden gems, and more.
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] text-gold uppercase tracking-widest mb-2">Try asking</p>
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => sendMessage(prompt)}
                  className="w-full text-left"
                >
                  <GlassCard className="p-3 flex items-center gap-3 hover:bg-white/10 transition-all">
                    <Sparkles className="w-4 h-4 text-gold flex-shrink-0" />
                    <span className="text-xs text-mora-primary">{prompt}</span>
                  </GlassCard>
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] ${msg.role === "user" ? "" : ""}`}>
              {msg.role === "assistant" && (
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-6 h-6 rounded-lg bg-mora-gold/10 flex items-center justify-center">
                    <Sparkles className="w-3 h-3 text-gold" />
                  </div>
                  <span className="text-[10px] text-gold">MORA AI</span>
                </div>
              )}
              <GlassCard 
                className={`p-4 ${msg.role === "user" ? "glass-gold" : ""}`}
              >
                <ReactMarkdown className="text-sm text-mora-primary leading-relaxed prose prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 prose-headings:text-gold prose-strong:text-mora-primary prose-li:text-mora-primary">
                  {msg.content}
                </ReactMarkdown>
              </GlassCard>
              
              {msg.role === "assistant" && (
                <div className="flex gap-2 mt-2 flex-wrap">
                  <button
                    onClick={() => handleSaveToTrip(msg.content)}
                    disabled={saving}
                    className="flex items-center gap-1.5 px-3 py-1.5 glass-light rounded-lg text-[10px] text-gold hover:bg-white/10 transition-all disabled:opacity-50"
                  >
                    <Save className="w-3 h-3" /> Save to Trips
                  </button>
                  <button
                    onClick={() => sendMessage("Regenerate this itinerary with different suggestions")}
                    className="flex items-center gap-1.5 px-3 py-1.5 glass-light rounded-lg text-[10px] text-mora-neutral hover:text-mora-primary hover:bg-mora-primary/5 transition-all"
                  >
                    <RefreshCw className="w-3 h-3" /> Regenerate
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <GlassCard className="p-4 flex items-center gap-3">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-mora-gold rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-2 h-2 bg-mora-gold/70 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-2 h-2 bg-mora-gold/40 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
              <span className="text-xs text-mora-neutral">Planning your journey...</span>
            </GlassCard>
          </div>
        )}
        
        <div ref={scrollRef} />
      </div>

      {/* Input */}
      <div className="px-6 pt-2 pb-3">
        <GlassCard className="p-2 flex items-center gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && sendMessage(input)}
            placeholder="Ask anything about your trip..."
            className="flex-1 bg-transparent text-sm text-mora-primary placeholder:text-mora-neutral px-3 py-2.5 outline-none"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            className="w-10 h-10 glass-gold rounded-xl flex items-center justify-center text-gold hover:glow-gold transition-all disabled:opacity-40"
          >
            <Send className="w-4 h-4" />
          </button>
        </GlassCard>
      </div>
    </div>
  );
}