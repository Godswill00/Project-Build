"""
schemas.py — TraceGuard Pydantic Schemas
========================================
Defines the request and response models for the /predict endpoint.

FlowInput  : 41 required network-flow feature fields + optional IP addresses.
PredictionResponse : classifier result, confidence, attack type, SHAP
                     explanation, and provenance context.
"""

from typing import Dict, List, Optional

# pyrefly: ignore [missing-import]
from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# SHAP feature-attribution entry
# ---------------------------------------------------------------------------
class ShapEntry(BaseModel):
    """A single SHAP feature attribution."""
    feature: str
    value: float


# ---------------------------------------------------------------------------
# Request body — one network-flow record
# ---------------------------------------------------------------------------
class FlowInput(BaseModel):
    """
    All 41 features required by the classifier, in the same order as
    feature_columns.joblib.  IP addresses are optional and used only for
    forensic logging / provenance-graph construction.
    """

    # --- Transport / protocol identifiers (integer) -----------------------
    L4_SRC_PORT: int = Field(..., description="Layer-4 source port")
    L4_DST_PORT: int = Field(..., description="Layer-4 destination port")
    PROTOCOL: int = Field(..., description="IP protocol number")
    L7_PROTO: int = Field(..., description="Layer-7 application protocol ID")

    # --- Byte / packet counts (float — can be large) ----------------------
    IN_BYTES: float = Field(..., description="Incoming bytes")
    IN_PKTS: int = Field(..., description="Incoming packets")
    OUT_BYTES: float = Field(..., description="Outgoing bytes")
    OUT_PKTS: int = Field(..., description="Outgoing packets")

    # --- TCP flags (integer bitmasks) -------------------------------------
    TCP_FLAGS: int = Field(..., description="Cumulative TCP flags")
    CLIENT_TCP_FLAGS: int = Field(..., description="Client-side TCP flags")
    SERVER_TCP_FLAGS: int = Field(..., description="Server-side TCP flags")

    # --- Duration / timing (float, milliseconds) --------------------------
    FLOW_DURATION_MILLISECONDS: float = Field(..., description="Total flow duration (ms)")
    DURATION_IN: float = Field(..., description="Inbound duration (ms)")
    DURATION_OUT: float = Field(..., description="Outbound duration (ms)")

    # --- TTL (integer) ----------------------------------------------------
    MIN_TTL: int = Field(..., description="Minimum TTL observed")
    MAX_TTL: int = Field(..., description="Maximum TTL observed")

    # --- Packet lengths (int) ---------------------------------------------
    LONGEST_FLOW_PKT: int = Field(..., description="Longest packet in the flow")
    SHORTEST_FLOW_PKT: int = Field(..., description="Shortest packet in the flow")
    MIN_IP_PKT_LEN: int = Field(..., description="Minimum IP packet length")
    MAX_IP_PKT_LEN: int = Field(..., description="Maximum IP packet length")

    # --- Throughput / rate (float) ----------------------------------------
    SRC_TO_DST_SECOND_BYTES: float = Field(..., description="Src→Dst bytes per second")
    DST_TO_SRC_SECOND_BYTES: float = Field(..., description="Dst→Src bytes per second")

    # --- Retransmission counters ------------------------------------------
    RETRANSMITTED_IN_BYTES: float = Field(..., description="Retransmitted inbound bytes")
    RETRANSMITTED_IN_PKTS: int = Field(..., description="Retransmitted inbound packets")
    RETRANSMITTED_OUT_BYTES: float = Field(..., description="Retransmitted outbound bytes")
    RETRANSMITTED_OUT_PKTS: int = Field(..., description="Retransmitted outbound packets")

    # --- Average throughput (float) ---------------------------------------
    SRC_TO_DST_AVG_THROUGHPUT: float = Field(..., description="Avg throughput Src→Dst")
    DST_TO_SRC_AVG_THROUGHPUT: float = Field(..., description="Avg throughput Dst→Src")

    # --- Packet-size distribution buckets (int counts) --------------------
    NUM_PKTS_UP_TO_128_BYTES: int = Field(..., description="Packets ≤128 bytes")
    NUM_PKTS_128_TO_256_BYTES: int = Field(..., description="Packets 128–256 bytes")
    NUM_PKTS_256_TO_512_BYTES: int = Field(..., description="Packets 256–512 bytes")
    NUM_PKTS_512_TO_1024_BYTES: int = Field(..., description="Packets 512–1024 bytes")
    NUM_PKTS_1024_TO_1514_BYTES: int = Field(..., description="Packets 1024–1514 bytes")

    # --- TCP window sizes (int) -------------------------------------------
    TCP_WIN_MAX_IN: int = Field(..., description="Max TCP window size (inbound)")
    TCP_WIN_MAX_OUT: int = Field(..., description="Max TCP window size (outbound)")

    # --- ICMP fields (int) ------------------------------------------------
    ICMP_TYPE: int = Field(..., description="ICMP type code")
    ICMP_IPV4_TYPE: int = Field(..., description="ICMP IPv4 type code")

    # --- DNS fields (int) -------------------------------------------------
    DNS_QUERY_ID: int = Field(..., description="DNS query ID")
    DNS_QUERY_TYPE: int = Field(..., description="DNS query type")
    DNS_TTL_ANSWER: int = Field(..., description="DNS TTL answer")

    # --- FTP (float — can include fractional codes) -----------------------
    FTP_COMMAND_RET_CODE: float = Field(..., description="FTP command return code")

    # --- Optional forensic metadata (NOT fed to classifier) ---------------
    source_ip: Optional[str] = Field(None, description="Source IP for forensic logging")
    destination_ip: Optional[str] = Field(None, description="Destination IP for forensic logging")

    class Config:
        json_schema_extra = {
            "example": {
                "L4_SRC_PORT": 443,
                "L4_DST_PORT": 49152,
                "PROTOCOL": 6,
                "L7_PROTO": 91,
                "IN_BYTES": 5200.0,
                "IN_PKTS": 10,
                "OUT_BYTES": 3200.0,
                "OUT_PKTS": 8,
                "TCP_FLAGS": 27,
                "CLIENT_TCP_FLAGS": 27,
                "SERVER_TCP_FLAGS": 18,
                "FLOW_DURATION_MILLISECONDS": 1500.0,
                "DURATION_IN": 800.0,
                "DURATION_OUT": 700.0,
                "MIN_TTL": 60,
                "MAX_TTL": 64,
                "LONGEST_FLOW_PKT": 1460,
                "SHORTEST_FLOW_PKT": 40,
                "MIN_IP_PKT_LEN": 40,
                "MAX_IP_PKT_LEN": 1500,
                "SRC_TO_DST_SECOND_BYTES": 3466.67,
                "DST_TO_SRC_SECOND_BYTES": 2133.33,
                "RETRANSMITTED_IN_BYTES": 0.0,
                "RETRANSMITTED_IN_PKTS": 0,
                "RETRANSMITTED_OUT_BYTES": 0.0,
                "RETRANSMITTED_OUT_PKTS": 0,
                "SRC_TO_DST_AVG_THROUGHPUT": 27733.33,
                "DST_TO_SRC_AVG_THROUGHPUT": 17066.67,
                "NUM_PKTS_UP_TO_128_BYTES": 4,
                "NUM_PKTS_128_TO_256_BYTES": 2,
                "NUM_PKTS_256_TO_512_BYTES": 1,
                "NUM_PKTS_512_TO_1024_BYTES": 1,
                "NUM_PKTS_1024_TO_1514_BYTES": 2,
                "TCP_WIN_MAX_IN": 65535,
                "TCP_WIN_MAX_OUT": 65535,
                "ICMP_TYPE": 0,
                "ICMP_IPV4_TYPE": 0,
                "DNS_QUERY_ID": 0,
                "DNS_QUERY_TYPE": 0,
                "DNS_TTL_ANSWER": 0,
                "FTP_COMMAND_RET_CODE": 0.0,
                "source_ip": "192.168.1.10",
                "destination_ip": "10.0.0.5",
            }
        }


# ---------------------------------------------------------------------------
# Response body
# ---------------------------------------------------------------------------
class PredictionResponse(BaseModel):
    """Result returned by the /predict endpoint."""

    prediction: str = Field(..., description="'Benign' or 'Malicious'")
    confidence: float = Field(..., description="Classifier confidence (probability)")
    attack_type: Optional[str] = Field(None, description="Attack category if malicious")
    shap_explanation: List[ShapEntry] = Field(
        default_factory=list,
        description="Top-10 SHAP feature attributions (malicious only)",
    )
    provenance: Optional[Dict] = Field(
        None, description="Provenance-graph traceback context"
    )
    source_ip: Optional[str] = Field(None, description="Echo of the submitted source IP")
    destination_ip: Optional[str] = Field(None, description="Echo of the submitted destination IP")
