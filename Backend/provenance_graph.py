"""
provenance_graph.py — TraceGuard In-Memory Provenance Graph
===========================================================
Maintains a live, in-memory NetworkX directed graph that records
relationships between IP addresses involved in malicious flows.

The graph starts empty and grows as /predict calls report malicious
traffic with IP metadata attached.
"""

from datetime import datetime
from typing import Any, Dict, List, Optional

import networkx as nx

# ---------------------------------------------------------------------------
# Module-level directed graph (empty at startup)
# ---------------------------------------------------------------------------
provenance: nx.DiGraph = nx.DiGraph()


def add_flow(
    source_ip: Optional[str],
    destination_ip: Optional[str],
    attack_type: Optional[str],
    confidence: float,
) -> None:
    """
    Record a malicious flow in the provenance graph.

    Adds (or updates) nodes for both IPs and creates a directed edge
    from source to destination with forensic attributes.

    Parameters
    ----------
    source_ip : str or None
        Source IP address.
    destination_ip : str or None
        Destination IP address.
    attack_type : str or None
        Human-readable attack category.
    confidence : float
        Classifier confidence score.
    """
    # Both IPs must be present to form a meaningful edge
    if source_ip is None or destination_ip is None:
        return

    # Ensure nodes exist (add_node is idempotent)
    provenance.add_node(source_ip)
    provenance.add_node(destination_ip)

    # Add a directed edge with forensic metadata
    provenance.add_edge(
        source_ip,
        destination_ip,
        attack_type=attack_type,
        confidence=confidence,
        timestamp=datetime.utcnow().isoformat(),
    )


def get_traceback(ip: Optional[str]) -> Optional[Dict[str, Any]]:
    """
    Return provenance context for a given IP address.

    Parameters
    ----------
    ip : str or None
        The IP address to look up.

    Returns
    -------
    dict or None
        A dict with ``out_degree``, ``in_degree``, ``connected_nodes``,
        and ``total_edges_in_graph``.  Returns None if the IP is not in the
        graph or is None.
    """
    if ip is None or ip not in provenance:
        return None

    # Collect all neighbours in either direction (predecessors + successors)
    predecessors: List[str] = list(provenance.predecessors(ip))
    successors: List[str] = list(provenance.successors(ip))
    connected_nodes: List[str] = list(set(predecessors + successors))

    return {
        "out_degree": provenance.out_degree(ip),
        "in_degree": provenance.in_degree(ip),
        "connected_nodes": connected_nodes,
        "total_edges_in_graph": provenance.number_of_edges(),
    }
