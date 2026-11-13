// Pipedream workflow code step: upload a Short to YouTube (posting route #2, after Zapier).
// Trigger: HTTP (multipart/form-data), "Return a custom response from your workflow". Settings: timeout 300 s, memory 512 MB.
// Form fields sent by `pipeline.sh pd-post`: video (file), thumbnail (file, optional), meta (JSON: channel, title,
// description, tags[], categoryId, madeForKids=false). Each channel = one YouTube account prop below (connect each once).
import got from "got";

export default defineComponent({
  props: {
    main: { type: "app", app: "youtube_data_api", label: "<channel>" },
    // add one prop per new channel when it exists, e.g.:
    // whatif: { type: "app", app: "youtube_data_api", label: "What If Max" },
  },
  async run({ steps, $ }) {
    const body = steps.trigger.event.body;
    const meta = JSON.parse(body.meta);
    const acct = this[meta.channel || "main"];
    if (!acct) throw new Error(`no YouTube account connected for channel ${meta.channel}`);
    const auth = { Authorization: `Bearer ${acct.$auth.oauth_access_token}` };
    // 1) start a resumable upload with the metadata
    const init = await got.post("https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status", {
      headers: { ...auth, "X-Upload-Content-Type": "video/mp4" },
      json: {
        snippet: { title: meta.title, description: meta.description, tags: meta.tags || [], categoryId: String(meta.categoryId || "27"), defaultLanguage: "en" },
        status: { privacyStatus: "public", selfDeclaredMadeForKids: false, embeddable: true },
      },
    });
    // 2) send the video bytes (the file Pipedream received, ~35 MB)
    const video = await got(body.video.url, { responseType: "buffer" });
    const res = await got.put(init.headers.location, { headers: { ...auth, "Content-Type": "video/mp4" }, body: video.body }).json();
    // 3) custom thumbnail (optional)
    let thumb = "skipped";
    if (body.thumbnail && body.thumbnail.url) {
      try {
        const t = await got(body.thumbnail.url, { responseType: "buffer" });
        await got.post(`https://www.googleapis.com/upload/youtube/v3/thumbnails/set?videoId=${res.id}`, { headers: { ...auth, "Content-Type": "image/jpeg" }, body: t.body });
        thumb = "set";
      } catch (e) { thumb = "failed: " + (e.response?.body || e.message).toString().slice(0, 200); }
    }
    await $.respond({ status: 200, headers: { "Content-Type": "application/json" }, body: { id: res.id, thumbnail: thumb } });
    return { id: res.id, thumbnail: thumb };
  },
});
