def _compute_similarity_graph(
    threshold: float = 0.5,
    max_nodes: int | None = None,
    top_k: int | None = None,
):
    df = db_manager.df
    if df.empty:
        return {"nodes": [], "edges": []}

    if max_nodes is not None and max_nodes > 0 and len(df) > max_nodes:
        df = df.head(max_nodes)

    abstracts = df["abstract"].astype(str).fillna("").tolist()
    ids = df["id"].astype(str).tolist()
    titles = df["title"].astype(str).tolist()

    # Safer TF-IDF defaults: include bigrams, filter very rare/common terms
    vectorizer = TfidfVectorizer(
        stop_words="english",
        ngram_range=(1, 2),
        min_df=2,
        max_df=0.9,
    )

    try:
        X = vectorizer.fit_transform(abstracts)
    except Exception:
        return {"nodes": [{"id": ids[i], "title": titles[i]} for i in range(len(ids))], "edges": []}

    nodes = [{"id": ids[i], "title": titles[i]} for i in range(len(ids))]
    edges: list[dict] = []
    n = len(ids)

    try:
        # For larger corpora, reduce dimensionality before neighbor search to speed up
        X_search = X
        if n > 2000 and getattr(X, "shape", (0, 0))[1] > 100:
            from sklearn.decomposition import TruncatedSVD
            svd = TruncatedSVD(n_components=100)
            X_search = svd.fit_transform(X)

        # NearestNeighbors radius search avoids building full n x n similarity matrix
        from sklearn.neighbors import NearestNeighbors

        radius = max(0.0, 1.0 - float(threshold))
        nn = NearestNeighbors(radius=radius, metric="cosine", algorithm="brute")
        nn.fit(X_search)
        distances, indices = nn.radius_neighbors(X_search, return_distance=True)

        for i_, (dists, inds) in enumerate(zip(distances, indices)):
            for dist, j in zip(dists, inds):
                if j <= i_:
                    continue
                score = 1.0 - float(dist)
                if score >= float(threshold):
                    edges.append({"source": ids[i_], "target": ids[j], "score": score})
    except Exception:
        # Fallback: dense cosine similarity (original behavior)
        sim_matrix = cosine_similarity(X)
        for i in range(n):
            for j in range(i + 1, n):
                score = float(sim_matrix[i, j])
                if score >= float(threshold):
                    edges.append({"source": ids[i], "target": ids[j], "score": score})

    # Optionally trim to top_k neighbors per node to limit graph size (keeps strongest edges)
    if top_k is not None and top_k > 0:
        neigh_map: dict[str, list[tuple[str, float]]] = {nid: [] for nid in ids}
        for e in edges:
            s = e["source"]
            t = e["target"]
            sc = float(e.get("score", 0.0))
            neigh_map.setdefault(s, []).append((t, sc))
            neigh_map.setdefault(t, []).append((s, sc))

        kept = set()
        new_edges: list[dict] = []
        for s, nbs in neigh_map.items():
            nbs_sorted = sorted(nbs, key=lambda x: x[1], reverse=True)[:top_k]
            for t, sc in nbs_sorted:
                a, b = (s, t) if s <= t else (t, s)
                key = (a, b)
                if key in kept:
                    continue
                kept.add(key)
                new_edges.append({"source": s, "target": t, "score": sc})
        edges = new_edges

    return {"nodes": nodes, "edges": edges}


@app.get("/api/v1/graph/global")
async def graph_global(threshold: float = Query(0.1, ge=0.0, le=1.0)):
    """
    Compute and return a global TF-IDF + Cosine similarity graph from all paper abstracts.
    All papers as nodes, all edges with similarity >= threshold (no top_k trimming).
    Results are cached in the `backend/database` folder to avoid recomputation.
    """
    cache_dir = db_module.DATA_DIR
    cache_dir.mkdir(exist_ok=True)
    cache_file = cache_dir / f"graph_global_{float(threshold):.2f}.json"

    if cache_file.exists():
        try:
            with cache_file.open("r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass

    graph = _compute_similarity_graph(threshold=threshold, max_nodes=None, top_k=None)

    try:
        with cache_file.open("w", encoding="utf-8") as f:
            json.dump(graph, f, indent=2, ensure_ascii=False)
    except Exception:
        pass

    return graph