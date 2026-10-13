import { mountFindNode } from "../widgets/findnode.js";
import { mountDegSeq } from "../widgets/degseq.js";
import { mountGraphNoise } from "../widgets/graphnoise.js";
import { mountFbTable } from "../widgets/fbtable.js";
export const lesson09 = {
    id: "graphs",
    title: "Privacy for graphs",
    blurb: "Who is friends with whom can identify you. Hide a node in a crowd, or hide every edge with noise.",
    slides: "91–120",
    steps: [
        {
            title: "Graphs, and what can go wrong",
            html: `
        <p>The lecture now turns to more complex data (slide 92): graphs, smart-grid data, streaming data with many
        releases, and privacy in settings such as federated learning and voting. These topics come from the lecturer's
        own research group.</p>
        <p>A graph G(V, E) has vertices (nodes) V and edges E ⊆ V × V, stored as an adjacency matrix (slide 95). Graphs
        represent social networks (people and friendships), communication networks, and also preferences: travellers vs.
        countries, customers vs. products (slide 96).</p>
        <p>The problem (slide 97): given G, produce a protected graph G′ that resembles G and avoids disclosure. The usual
        questions apply: which privacy model, is G′ still useful (information loss), is it safe (disclosure risk)?</p>
        <p>Disclosure (slide 100) means: an intruder with some information I about a node v can identify it. Examples
        of I are the <strong>degree</strong> |N(v)|, or the <strong>subgraph of its neighbours</strong> (a subgraph
        matching problem). Play the intruder on the slide's graph.</p>`,
            widget: mountFindNode,
            after: `
        <p>Knowing only the degree, every target hides among at least 2 nodes: the graph is already 2-degree anonymous.
        Knowing how the neighbours are linked singles out most nodes: only nodes 1, 2 and 3 still share their
        neighbourhood shape.</p>`,
            quiz: {
                q: "An intruder knows that the target has degree 3. How many nodes of the slide's graph fit?",
                options: [
                    "1",
                    "2",
                    "3",
                ],
                answer: 1,
                explain: "Degrees are 2, 2, 2, 4, 4, 3, 3, 2, 4 for nodes 1–9. Degree 3 leaves nodes 6 and 7. (Three nodes, 4, 5 and 9, have degree 4.) The intruder cannot tell 6 and 7 apart from the degree alone.",
            },
        },
        {
            title: "k-anonymity for graphs",
            html: `
        <p>Privacy models for graphs (slide 101):</p>
        <ul>
          <li><strong>k-degree anonymity:</strong> every degree is shared by at least k nodes;</li>
          <li><strong>1-neighbourhood anonymity:</strong> for each node n there are k − 1 other nodes whose neighbourhood graphs N(n<sub>i</sub>) are isomorphic;</li>
          <li><strong>differential privacy:</strong> node and edge differential privacy.</li>
        </ul>
        <p>A recipe for k-degree anonymity (slide 103): find the degree sequence of G; <em>microaggregate</em> it (it
        must stay a sequence of integers); check that the new sequence is <strong>graphical</strong>, i.e. some graph
        has exactly these degrees; then swap edges in G to reach a G′ with those degrees.</p>`,
            widget: mountDegSeq,
            after: `
        <p>With k = 3 the rounded means give degrees whose sum is odd. Every edge adds 2 to the sum of degrees, so no
        graph can have that sequence: “Degree sequence needs to be graphical!!” The rounding has to be adjusted before
        any edges are swapped.</p>
        <p>Slide 104 sketches another construction: keep V′ = V, cluster the nodes into groups of at least k, decide for
        every pair of clusters whether they are connected, and connect two nodes in G′ exactly when their clusters are
        connected.</p>`,
            quiz: {
                q: "Why can a degree sequence with an odd sum never be realised by a graph?",
                options: [
                    "Every edge adds 2 to the sum of degrees, so the sum must be even.",
                    "A graph needs an even number of nodes for its degrees to pair up.",
                    "Rounded group means are always even, so an odd sum is a rounding error.",
                ],
                answer: 0,
                explain: "Σ deg(v) = 2|E|, always even, whatever the number of nodes (a triangle has 3 nodes and degree sum 6). Evenness is necessary but not sufficient; the Erdős–Gallai test (used in the widget, standard background) checks the rest.",
            },
        },
        {
            title: "Edge differential privacy: add a noise graph",
            html: `
        <p>Edge local differential privacy (slide 106): an edge randomization algorithm A satisfies ε-edge local DP if
        for every pair of nodes u, v and x, x′, y ∈ {0, 1},</p>
        <math display="block"><mi>P</mi><mo>(</mo><msub><mn>1</mn><mrow><mi>A</mi><mo>(</mo><mi>u</mi><mi>v</mi><mo>)</mo></mrow></msub><mo>=</mo><mi>y</mi><mo>|</mo><msub><mn>1</mn><mrow><mi>u</mi><mi>v</mi></mrow></msub><mo>=</mo><mi>x</mi><mo>)</mo><mo>≤</mo><msup><mi>e</mi><mi mathvariant="normal">ε</mi></msup><mi>P</mi><mo>(</mo><msub><mn>1</mn><mrow><mi>A</mi><mo>(</mo><mi>u</mi><mi>v</mi><mo>)</mo></mrow></msub><mo>=</mo><mi>y</mi><mo>|</mo><msub><mn>1</mn><mrow><mi>u</mi><mi>v</mi></mrow></msub><mo>=</mo><msup><mi>x</mi><mo>′</mo></msup><mo>)</mo></math>
        <p>Ad hoc protection randomly adds and deletes nodes or edges and checks with attacks how much is needed (slide
        107). The lecturer's proposal is inspired by noise addition X′ = X + ε for numbers (slide 109):
        <strong>noise graph addition</strong> G′ = G ⊕ g (slide 110). Align the nodes of both graphs and take the
        symmetric difference of the edges, E′ = E Δ E<sub>g</sub> = (E \\ E<sub>g</sub>) ∪ (E<sub>g</sub> \\ E). For g
        use a Gilbert random graph G(n, p): each possible edge is chosen with probability p (slide 113); for bipartite
        graphs, G(n, m, p) chooses each U–V edge with probability p (slide 114).</p>`,
            quiz: {
                q: "G ⊕ g flips each possible edge (present ↔ absent) independently with probability p. That is randomized response on every edge bit. With Lesson 7's formula for c = 2, which ε do you expect?",
                options: [
                    "ε = ln((1 − p)/p)",
                    "ε = ln(1/p)",
                    "ε = p/(1 − p)",
                ],
                answer: 0,
                explain: "The bit is kept with probability 1 − p and flipped with p, so the matrix is ((1 − p, p), (p, 1 − p)) and ε = ln((1 − p)/p). That is the theorem on slide 115.",
            },
        },
        {
            title: "Noise graphs in action",
            html: `
        <p><strong>Definition</strong> (slide 115). For 0 &lt; p &lt; 1/2 the noise-graph mechanism is
        A<sub>n,p</sub>(G) = E(G ⊕ g) with g ∈ G(n, p). <strong>Theorem.</strong> It provides
        ln((1 − p)/p)-differential privacy, for edge differential privacy: the presence or absence of an edge does not
        make a difference, which hides individual edges.</p>`,
            widget: mountGraphNoise,
            after: `
        <p>Small p keeps most of G (high ε, weak privacy). As p approaches 1/2, ε approaches 0, but G ⊕ g also
        approaches a completely random graph. The slides restrict p to (0, 1/2).</p>`,
            quiz: {
                q: "What happens at p = 1/2?",
                options: [
                    "ε = 0, and G ⊕ g is a random graph that says nothing about G.",
                    "ε = ln 2, and about half of the edges of G survive in G ⊕ g.",
                    "ε = 0, and G ⊕ g is the complement of G, so G can be recovered.",
                ],
                answer: 0,
                explain: "ln((1 − 1/2)/(1/2)) = ln 1 = 0. Each edge is a fair coin flip whatever G was: total privacy, zero utility, like the all-halves matrix of Lesson 7. The complement would need p = 1, which flips every edge deterministically.",
            },
        },
        {
            title: "At scale: Facebook likes, communities, time",
            html: `
        <p>Slide 116 applies the mechanism to Facebook likes data (after trimming: min 50 likes, 150 users per like):
        19 724 users, 8523 likes and 3 817 840 user–like pairs.</p>`,
            widget: mountFbTable,
            after: `
        <p>Almost every edge of g is a new edge, because the possible pairs (168 million) vastly outnumber the real ones
        (3.8 million). Even p = 0.005 adds about 840 000 fake likes, more than a fifth of the number of real ones.</p>
        <p>The slide then plots prediction accuracy against ε for gender, age, political views and five variables labelled agr, con, ext, neu and ope (probably personality traits; the slide does not spell them out).
        Read off its chart: accuracy rises with ε, e.g. gender from about 0.55 at ε = 0.4 to about 0.93 at ε = 5.3, and age from
        about 0.15 to about 0.6.</p>
        <p class="note">The chart's x-axis has a point at ε = 0.8 that is not in the table, which lists 0.40, 1.38, 2.19, 2.94 and 5.29.</p>
        <p><strong>Communities</strong> (slides 117–118): community detection uses the signless Laplacian |L| = D + A
        (D the diagonal matrix of degrees, A the adjacency matrix), an SVD of |L|, a reduced approximation, dot products
        as similarities between vertices, and fuzzy clustering so that a node can belong to several communities. For two
        communities generated with a Gilbert model and g<sub>p</sub> ∼ G(n + m, p), the membership correlation between G
        and G<sub>p</sub> stays close to 1 for small p and drops for p around 0.3–0.4.</p>
        <p class="note">Slide 118's right-hand chart (values 0–1200, same p on the x-axis, series 10x2 to 50x2) has no
        y-axis label, and the slide does not say what it measures.</p>
        <p><strong>Dynamic graphs</strong> (slide 120): a graph that evolves as snapshots G<sub>0</sub>, …, G<sub>T</sub>.
        Edge-local DP is required at every time stamp, and the parallel protection mechanism applies a noise-graph
        mechanism A<sub>p0,p1</sub> to each snapshot separately.</p>`,
            quiz: {
                q: "The Facebook table shows |E(G ⊕ g)| = 68 million at p = 0.4, although G has 3.8 million likes. What does that mean for an analyst?",
                options: [
                    "Most published likes are fake, so statistics must correct for the known p.",
                    "The fake edges are spread evenly, so they cancel out in any statistic.",
                    "Individual likes stay reliable; only the total count is inflated.",
                ],
                answer: 0,
                explain: "About 97 % of the published likes are fake. Like randomized response, the noise rate p is known, so aggregate statistics can be corrected (compare the π̂ estimator). Individual likes, however, are no longer trustworthy, which is the point.",
            },
        },
    ],
};
