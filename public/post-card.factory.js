/**
 * PostCardFactory — Factory Pattern (Creational)
 *
 * Problem: `renderFeed` in index.js contained 100+ lines of imperative DOM
 * construction for each card, all inline. The function knew both HOW to fetch
 * data and HOW to build every element of a card, violating single responsibility.
 * Any structural change to a card required digging through `renderFeed`.
 *
 * Solution: PostCardFactory centralises card creation behind a single static
 * `create(post, opts)` method. The caller only decides WHEN and WHAT to render;
 * the factory decides HOW. Private static methods handle each sub-section,
 * keeping each concern isolated and easy to change independently.
 */
export class PostCardFactory {
    /**
     * @param {object} post
     * @param {{ comments?: object[], onLike: (postId: number) => void, onComment: (postId: number, content: string) => void }} opts
     * @returns {HTMLElement}
     */
    static create(post, { comments = [], onLike, onComment }) {
        const card = document.createElement("article")
        card.className =
            "w-full max-w-[380px] rounded border border-zinc-300 bg-white shadow-sm"

        card.appendChild(PostCardFactory.#buildImage(post))
        card.appendChild(PostCardFactory.#buildBody(post, comments, onLike, onComment))

        return card
    }

    static #buildImage({ imageUrl, title }) {
        const img = document.createElement("img")
        img.className = "h-72 w-full object-cover bg-zinc-200"
        img.src = imageUrl
        img.alt = title
        img.loading = "lazy"
        return img
    }

    static #buildBody(post, comments, onLike, onComment) {
        const body = document.createElement("div")
        body.className = "space-y-3 p-4"

        body.appendChild(PostCardFactory.#buildTitle(post.title))
        body.appendChild(PostCardFactory.#buildDescription(post.description))
        body.appendChild(PostCardFactory.#buildStats(post, onLike))
        body.appendChild(PostCardFactory.#buildCommentsSection(post.id, comments, onComment))

        return body
    }

    static #buildTitle(title) {
        const el = document.createElement("h3")
        el.className = "text-lg font-semibold text-zinc-900"
        el.textContent = title
        return el
    }

    static #buildDescription(description) {
        const el = document.createElement("p")
        el.className = "text-sm leading-6 text-zinc-700"
        el.textContent = description
        return el
    }

    static #buildStats(post, onLike) {
        const stats = document.createElement("div")
        stats.className = "grid grid-cols-3 gap-2 text-center text-xs"

        const likeBtn = document.createElement("button")
        likeBtn.type = "button"
        likeBtn.className =
            "inline-flex items-center justify-center gap-1 rounded border border-zinc-900 bg-zinc-900 px-2 py-1 text-white"
        likeBtn.innerHTML = `<i class="bi bi-heart-fill"></i><span>${post.likesCount || 0}</span>`
        likeBtn.addEventListener("click", () => onLike(post.id))

        const commentsEl = document.createElement("span")
        commentsEl.className =
            "rounded border border-zinc-200 bg-zinc-50 px-2 py-1 text-zinc-600"
        commentsEl.textContent = `Comments ${post.commentsCount || 0}`

        const relevanceEl = document.createElement("span")
        relevanceEl.className =
            "rounded border border-zinc-200 bg-zinc-50 px-2 py-1 text-zinc-600"
        relevanceEl.textContent = `Relevance ${post.relevanceScore || 0}`

        stats.append(likeBtn, commentsEl, relevanceEl)
        return stats
    }

    static #buildCommentsSection(postId, comments, onComment) {
        const wrapper = document.createElement("div")
        wrapper.className = "space-y-2"

        const label = document.createElement("p")
        label.className =
            "inline-flex items-center gap-2 text-xs font-semibold uppercase text-zinc-500"
        label.innerHTML = '<i class="bi bi-chat-left-text"></i><span>Comments</span>'

        const list = document.createElement("div")
        list.className =
            "max-h-32 space-y-1 overflow-y-auto rounded border border-zinc-200 bg-zinc-50 p-2 pr-1"

        if (comments.length === 0) {
            const empty = document.createElement("p")
            empty.className = "text-xs text-zinc-500"
            empty.textContent = "No comments yet"
            list.appendChild(empty)
        } else {
            comments.slice(0, 5).forEach((c) => {
                const item = document.createElement("p")
                item.className = "rounded bg-zinc-100 px-2 py-1 text-xs text-zinc-700"
                item.textContent = c.content
                list.appendChild(item)
            })
        }

        wrapper.append(label, list, PostCardFactory.#buildCommentForm(postId, onComment))
        return wrapper
    }

    static #buildCommentForm(postId, onComment) {
        const form = document.createElement("form")
        form.className = "flex gap-2"

        const input = document.createElement("input")
        input.className =
            "w-full rounded border border-zinc-300 px-2 py-1 text-xs outline-none"
        input.placeholder = "Write a comment"

        const btn = document.createElement("button")
        btn.className =
            "inline-flex items-center gap-1 rounded border border-zinc-900 bg-zinc-900 px-3 py-1 text-xs text-white"
        btn.type = "submit"
        btn.innerHTML = '<i class="bi bi-send"></i><span>Send</span>'

        form.append(input, btn)
        form.addEventListener("submit", (e) => {
            e.preventDefault()
            const content = input.value.trim()
            if (content) {
                onComment(postId, content)
                input.value = ""
            }
        })

        return form
    }
}
