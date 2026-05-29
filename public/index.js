import {
    addLike,
    createComment,
    createPost,
    listComments,
    listFeed,
    listPosts,
} from "./posts-api.js"
import { PostCardFactory } from "./post-card.factory.js"
import { Store } from "./store.js"
import { CommentValidationStrategy, PostValidationStrategy } from "./validators.js"

// ── Observable Store (Observer Pattern) ──────────────────────────────────────
// Single source of truth. renderFeed subscribes once; any setState call
// automatically triggers a re-render without manual coordination.
const store = new Store({
    posts: [],
    commentsByPost: {},
    mode: "latest",
})

// ── DOM refs ──────────────────────────────────────────────────────────────────
const modalElement = document.querySelector("#post-modal")
const postFormElement = document.querySelector("#post-form")
const feedElement = document.querySelector("#feed")
const openModalButton = document.querySelector("[data-open-modal]")
const closeModalButton = document.querySelector("[data-close-modal]")
const refreshFeedButton = document.querySelector("#refresh-feed")
const feedModeElement = document.querySelector("#feed-mode")

// ── Helpers ───────────────────────────────────────────────────────────────────
const clearElement = (element) => {
    while (element.firstChild) {
        element.removeChild(element.firstChild)
    }
}

const renderError = (message) => {
    if (!feedElement) {
        return
    }

    clearElement(feedElement)
    const errorNode = document.createElement("p")
    errorNode.className =
        "col-span-full rounded border border-red-300 bg-red-50 px-6 py-4 text-sm text-red-700"
    errorNode.textContent = message
    feedElement.appendChild(errorNode)
}

// ── Observer subscriber ───────────────────────────────────────────────────────
// renderFeed is the Observer. It receives the full state snapshot and rebuilds
// the feed. It delegates card construction to PostCardFactory (Factory Pattern).
const renderFeed = ({ posts, commentsByPost }) => {
    if (!feedElement) {
        return
    }

    clearElement(feedElement)

    if (posts.length === 0) {
        const emptyNode = document.createElement("p")
        emptyNode.className =
            "col-span-full rounded border border-zinc-300 bg-white px-6 py-4 text-sm text-zinc-600"
        emptyNode.textContent = "No hay posts todavia."
        feedElement.appendChild(emptyNode)
        return
    }

    posts.forEach((post) => {
        // Factory Pattern: card construction is fully delegated to PostCardFactory.
        const card = PostCardFactory.create(post, {
            comments: commentsByPost[post.id] || [],
            onLike: handleLike,
            onComment: handleComment,
        })
        feedElement.appendChild(card)
    })
}

// ── Action handlers ───────────────────────────────────────────────────────────
const handleLike = async (postId) => {
    try {
        await addLike(postId, { reactionType: "like", weight: 1 })
        await refreshFeed()
    } catch (error) {
        renderError(error instanceof Error ? error.message : "Like failed")
    }
}

const handleComment = async (postId, content) => {
    try {
        // Strategy Pattern: validation rules are delegated to CommentValidationStrategy.
        CommentValidationStrategy.validate({ content })
        await createComment(postId, { content })
        await refreshFeed()
    } catch (error) {
        renderError(
            error instanceof Error ? error.message : "Create comment failed",
        )
    }
}

// ── Modal ─────────────────────────────────────────────────────────────────────
const openModal = () => {
    if (modalElement) {
        modalElement.showModal()
    }
}

const closeModal = () => {
    if (modalElement) {
        modalElement.close()
    }

    if (postFormElement) {
        postFormElement.reset()
    }
}

// ── Post creation ─────────────────────────────────────────────────────────────
const handleCreatePost = async () => {
    if (!postFormElement) {
        return
    }

    const formData = new FormData(postFormElement)
    const payload = {
        title: String(formData.get("title") || "").trim(),
        description: String(formData.get("description") || "").trim(),
        imageUrl: String(formData.get("imageUrl") || "").trim(),
    }

    // Strategy Pattern: validation rules are delegated to PostValidationStrategy.
    PostValidationStrategy.validate(payload)
    await createPost(payload)
}

// ── Data loading ──────────────────────────────────────────────────────────────
// All data is fetched and aggregated before a single setState call.
// This ensures the Observer is notified once with a complete snapshot,
// avoiding multiple intermediate re-renders.
const refreshFeed = async () => {
    try {
        const listResponse = await listPosts()
        const listItems = Array.isArray(listResponse)
            ? listResponse
            : listResponse?.items

        if (!Array.isArray(listItems)) {
            throw new Error("Broken /api/posts response")
        }

        const { mode } = store.getState()
        const feedResponse = await listFeed(mode)
        const feedRows = Array.isArray(feedResponse)
            ? feedResponse
            : feedResponse?.rows

        if (!Array.isArray(feedRows)) {
            throw new Error("Broken /api/posts/feed response")
        }

        const commentsByPost = {}
        for (const post of feedRows) {
            const response = await listComments(post.id)
            if (response && Array.isArray(response.comments)) {
                commentsByPost[post.id] = response.comments
            }
        }

        // Single setState → single render via Observer subscription.
        store.setState(() => ({ posts: feedRows, commentsByPost }))
    } catch (error) {
        renderError(
            error instanceof Error ? error.message : "No se pudo cargar",
        )
    }
}

// ── Event binding ─────────────────────────────────────────────────────────────
const bindEvents = () => {
    openModalButton?.addEventListener("click", openModal)
    closeModalButton?.addEventListener("click", closeModal)
    refreshFeedButton?.addEventListener("click", refreshFeed)

    feedModeElement?.addEventListener("change", () => {
        store.setState(() => ({ mode: feedModeElement.value }))
        refreshFeed()
    })

    postFormElement?.addEventListener("submit", async (event) => {
        event.preventDefault()

        try {
            await handleCreatePost()
            closeModal()
            await refreshFeed()
        } catch (error) {
            renderError(
                error instanceof Error
                    ? error.message
                    : "No se pudo crear el post",
            )
        }
    })
}

// ── Bootstrap ─────────────────────────────────────────────────────────────────
store.subscribe(renderFeed)
bindEvents()
refreshFeed()
