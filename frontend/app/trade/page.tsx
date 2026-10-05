"use client";

import { useState } from "react";
import { trades } from "../data/trades";
import ProtectedPage from "../components/auth/ProtectedPage";
import RoleGate from "../components/auth/RoleGate";
import { TradeDocument, DocStatus, DocType } from "../types";
import { FileText, CheckCircle, Clock, AlertTriangle, ExternalLink, Link2, Shield } from "lucide-react";

const statusConfig: Record<DocStatus, { bg: string; text: string; border: string; icon: any }> = {
  "Processed": { bg: "rgba(74,99,71,0.08)", text: "#4A6347", border: "rgba(74,99,71,0.25)", icon: CheckCircle },
  "Verified": { bg: "rgba(74,85,104,0.08)", text: "#4A5568", border: "rgba(74,85,104,0.25)", icon: Shield },
  "Pending": { bg: "rgba(166,139,61,0.08)", text: "#A68B3D", border: "rgba(166,139,61,0.25)", icon: Clock },
  "Flagged": { bg: "rgba(139,82,82,0.08)", text: "#8B5252", border: "rgba(139,82,82,0.25)", icon: AlertTriangle },
};

const docTypeIcons: Record<DocType, string> = {
  "Bill of Lading": "📋",
  "Letter of Credit": "🏦",
  "Certificate of Origin": "🌐",
  "Packing List": "📦",
  "Insurance Certificate": "🛡",
  "Phytosanitary Certificate": "🌿",
  "Commercial Invoice": "💼",
};

function DocCard({ doc, selected, onSelect }: { doc: TradeDocument; selected: boolean; onSelect: () => void }) {
  const cfg = statusConfig[doc.status];
  const StatusIcon = cfg.icon;
  return (
    <div
      className="card-soft card-soft--hover cursor-pointer"
      style={{
        borderLeftWidth: "2px",
        borderLeftColor: selected ? "#B89B4A" : cfg.text,
        background: selected ? "rgba(232,220,196,0.15)" : "white",
      }}
      onClick={onSelect}
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-start gap-3">
            <span className="text-2xl flex-shrink-0 mt-0.5">{docTypeIcons[doc.type]}</span>
            <div>
              <div className="font-body text-xs tracking-[0.3em] uppercase text-greige mb-1">{doc.type}</div>
              <div className="font-body text-sm text-charcoal-deep font-medium leading-snug">
                {doc.title}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <StatusIcon size={12} style={{ color: cfg.text }} />
            <span
              className="font-body text-xs tracking-[0.2em] uppercase px-2 py-1 border"
              style={{ background: cfg.bg, color: cfg.text, borderColor: cfg.border }}
            >
              {doc.status}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-1 mb-3">
          <div>
            <span className="font-body text-xs text-greige">Vessel: </span>
            <span className="font-body text-xs text-charcoal-warm">{doc.vesselName}</span>
          </div>
          <div>
            <span className="font-body text-xs text-greige">Value: </span>
            <span className="font-body font-num text-sm text-charcoal-deep font-medium">
              {doc.currency} {(doc.value / 1000000).toFixed(1)}M
            </span>
          </div>
          <div>
            <span className="font-body text-xs text-greige">From: </span>
            <span className="font-body text-xs text-charcoal-warm">{doc.portOfLoading}</span>
          </div>
          <div>
            <span className="font-body text-xs text-greige">To: </span>
            <span className="font-body text-xs text-charcoal-warm">{doc.portOfDischarge}</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-sand/20">
          <span className="font-body text-xs text-stone">
            Issued {new Date(doc.issuedDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
          </span>
          {doc.smartContractHash && (
            <div className="flex items-center gap-1">
              <Link2 size={10} className="text-sapphire-mist" />
              <span className="font-body text-xs tracking-[0.1em] text-sapphire-mist">On-chain</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SmartContractPanel({ doc }: { doc: TradeDocument }) {
  if (!doc.smartContractHash) {
    return (
      <div className="h-full flex items-center justify-center" style={{ background: "#2C3E50", minHeight: 300 }}>
        <div className="text-center">
          <FileText size={32} className="text-sapphire-mist mx-auto mb-3" />
          <div className="font-body text-sm text-greige">No smart contract linked</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: "#2C3E50" }} className="p-7">
      <div className="flex items-center gap-2 mb-1">
        <Link2 size={14} className="text-gold-soft" />
        <span className="font-body text-xs tracking-[0.3em] uppercase text-gold-soft">Blockchain Record</span>
      </div>
      <div className="text-h2 text-ivory-cream mb-6">
        Smart Contract
      </div>

      <div className="space-y-4">
        <div>
          <div className="font-body text-xs tracking-[0.3em] uppercase text-sapphire-mist mb-1">Network</div>
          <div className="font-body text-sm text-ivory-cream">{doc.blockchainNetwork}</div>
        </div>

        <div>
          <div className="font-body text-xs tracking-[0.3em] uppercase text-sapphire-mist mb-1">Transaction Hash</div>
          <div className="font-body text-xs text-ivory-cream/80 break-all font-mono tracking-wide">{doc.smartContractHash}</div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
          <div>
            <div className="font-body text-xs tracking-[0.3em] uppercase text-sapphire-mist mb-1">Status</div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-maritime-success" />
              <span className="font-body text-sm text-ivory-cream">Confirmed</span>
            </div>
          </div>
          <div>
            <div className="font-body text-xs tracking-[0.3em] uppercase text-sapphire-mist mb-1">Block Height</div>
            <div className="font-body font-num text-lg text-ivory-cream" style={{ fontWeight: 500, letterSpacing: "-0.01em" }}>19,847,221</div>
          </div>
          <div>
            <div className="font-body text-xs tracking-[0.3em] uppercase text-sapphire-mist mb-1">Confirmations</div>
            <div className="font-body font-num text-lg text-ivory-cream" style={{ fontWeight: 500, letterSpacing: "-0.01em" }}>342</div>
          </div>
          <div>
            <div className="font-body text-xs tracking-[0.3em] uppercase text-sapphire-mist mb-1">Gas Used</div>
            <div className="font-body font-num text-lg text-ivory-cream" style={{ fontWeight: 500, letterSpacing: "-0.01em" }}>84,221</div>
          </div>
        </div>

        <div className="pt-4 border-t border-white/10">
          <div className="font-body text-xs tracking-[0.3em] uppercase text-sapphire-mist mb-2">Contract Parties</div>
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <span className="font-body text-xs text-sapphire-mist w-16 flex-shrink-0 mt-0.5">Shipper</span>
              <span className="font-body text-xs text-ivory-cream/80">{doc.shipper}</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-body text-xs text-sapphire-mist w-16 flex-shrink-0 mt-0.5">Consignee</span>
              <span className="font-body text-xs text-ivory-cream/80">{doc.consignee}</span>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-white/10">
          <div className="font-body text-xs tracking-[0.3em] uppercase text-sapphire-mist mb-2">Trade Value</div>
          <div className="font-body font-num text-3xl text-gold-soft" style={{ fontWeight: 500, letterSpacing: "-0.02em" }}>
            {doc.currency} {(doc.value / 1000000).toFixed(1)}M
          </div>
        </div>

        <button className="w-full flex items-center justify-center gap-2 border border-white/20 py-3 text-ivory-cream/70 hover:border-gold-muted hover:text-gold-soft transition-colors duration-200 mt-2">
          <ExternalLink size={12} />
          <span className="font-body text-xs tracking-[0.2em] uppercase">View on Explorer</span>
        </button>
      </div>
    </div>
  );
}

function TradeContent() {
  const [selected, setSelected] = useState<TradeDocument | null>(trades[0]);
  const [statusFilter, setStatusFilter] = useState<DocStatus | "All">("All");

  const filtered = statusFilter === "All" ? trades : trades.filter((t) => t.status === statusFilter);

  const stats = {
    processed: trades.filter((t) => t.status === "Processed").length,
    pending: trades.filter((t) => t.status === "Pending").length,
    flagged: trades.filter((t) => t.status === "Flagged").length,
    totalValue: trades.reduce((s, t) => s + t.value, 0),
    onChain: trades.filter((t) => !!t.smartContractHash).length,
  };

  return (
    <div className="min-h-full" style={{ background: "#FAF8F5" }}>
      {/* Header */}
      <div className="px-8 lg:px-12 pt-10 pb-8 border-b border-sand/30">
        <div className="text-label-sm text-greige mb-3">Intelligence</div>
        <h1 className="text-h1 text-charcoal-deep">
          Trade Intelligence
        </h1>
        <div className="flex items-center gap-3 mt-3">
          <div className="w-12 h-px bg-gold-muted opacity-60" />
          <span className="font-body text-sm text-greige">
            {trades.length} documents · {stats.onChain} on-chain · $
            {(stats.totalValue / 1000000).toFixed(0)}M total value
          </span>
        </div>
      </div>

      {/* Stats bar */}
      <div className="px-8 lg:px-12 pt-6 pb-5">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {[
            { label: "Total Docs", value: trades.length, color: "#4A5568" },
            { label: "Processed", value: stats.processed, color: "#4A6347" },
            { label: "Pending", value: stats.pending, color: "#A68B3D" },
            { label: "Flagged", value: stats.flagged, color: "#8B5252" },
            { label: "On-Chain", value: stats.onChain, color: "#B89B4A" },
          ].map((s) => (
            <div key={s.label} className="card-soft p-5">
              <div className="font-body font-num text-3xl mb-1" style={{ fontWeight: 500, letterSpacing: "-0.02em", color: s.color }}>
                {s.value}
              </div>
              <div className="font-body text-xs tracking-[0.3em] uppercase text-greige">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Filter + Create */}
      <div className="px-8 lg:px-12 pb-5">
        <div className="flex items-end justify-between gap-6 flex-wrap">
          <div className="tab-row flex-1 min-w-0">
            {["All", "Processed", "Verified", "Pending", "Flagged"].map((f) => {
              const isActive = statusFilter === f;
              return (
                <button
                  key={f}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setStatusFilter(f as any)}
                  className="tab-item"
                  style={{ borderBottomColor: isActive ? "#2D2A26" : "transparent" }}
                >
                  {f}
                </button>
              );
            })}
          </div>
          <RoleGate anyPermission={["VIEW_ALL", "CREATE_TRADE", "APPROVE"]}>
            <button className="btn-base btn-ghost pb-2">
              + New document
            </button>
          </RoleGate>
        </div>
      </div>

      {/* Content */}
      <div className="px-8 lg:px-12 pb-12 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Document list */}
        <div className="lg:col-span-2 space-y-4">
          {filtered.map((doc) => (
            <DocCard
              key={doc.id}
              doc={doc}
              selected={selected?.id === doc.id}
              onSelect={() => setSelected(doc)}
            />
          ))}
        </div>

        {/* Smart contract panel */}
        <div className="lg:col-span-1">
          <div className="sticky top-4">
            {selected ? (
              <SmartContractPanel doc={selected} />
            ) : (
              <div className="flex items-center justify-center h-48 bg-white border border-sand/40">
                <div className="text-center">
                  <FileText size={24} className="text-taupe mx-auto mb-2" />
                  <div className="font-body text-sm text-greige">Select a document to view details</div>
                </div>
              </div>
            )}

            {/* Approve action — gated */}
            {selected && (
              <RoleGate anyPermission={["VIEW_ALL", "APPROVE"]}>
                <div className="mt-3">
                  <button className="w-full font-body text-xs tracking-[0.3em] uppercase px-5 py-3 bg-charcoal-deep text-ivory-cream hover:bg-noir transition-colors duration-200">
                    Approve Document
                  </button>
                </div>
              </RoleGate>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TradePage() {
  return (
    <ProtectedPage path="/trade">
      <TradeContent />
    </ProtectedPage>
  );
}
