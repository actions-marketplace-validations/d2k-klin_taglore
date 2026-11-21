import json
gen={"name":"taglore","version":"1.7.0","provider":"copilot","model":"default"}
def rel(v,prev,t,date,title,summary,hl,imp,fix,brk=()):
    it=lambda xs:[{"title":a,"description":b,"commits":["a1b2c3d"]} for a,b in xs]
    return {"schemaVersion":1,"version":v,"previousVersion":prev,"releaseType":t,"announce":t in("major","minor"),"date":date,"title":title,"summary":summary,
            "highlights":it(hl),"improvements":it(imp),"fixes":it(fix),"breaking":it(brk),"links":{"release":None,"compare":None},"generator":gen}
latest=rel("v2.4.0","v2.3.0","minor","2026-11-18","Search that finds what you meant",
 "Search now understands typos and partial words, and large projects open noticeably faster.",
 [("Typo-tolerant search","Find tasks even when you misspell a word or type only part of it."),
  ("Dark mode","Switch between light and dark in Settings, or follow your system.")],
 [("Faster project loading","Projects with thousands of tasks open about twice as fast."),
  ("Clearer due dates","Overdue tasks are marked in red in every list.")],
 [("Attachments in comments","Files attached to a comment no longer disappear after editing it.")])
hist={"schemaVersion":1,"releases":[latest,
 rel("v2.3.1","v2.3.0","patch","2026-11-04","Calendar sync fix","A fix for calendar sync after daylight saving time.",[],[],[("Calendar sync","Events no longer shift by one hour after the clock change.")]),
 rel("v2.3.0","v2.2.0","minor","2026-10-21","Shared templates","Teams can now share project templates.",[("Shared templates","Save a project as a template and share it with your team.")],[("Keyboard shortcuts","Press ? to see every shortcut.")],[]),
 rel("v2.0.0","v1.9.0","major","2026-09-02","A new home screen","Your work, today's tasks and recent activity on one screen.",[("New home screen","See everything due today at a glance.")],[],[],[("Old API removed","The v1 API is switched off. Move integrations to the v2 API.")])]}
json.dump(latest,open("release-notes/latest.json","w")); json.dump(hist,open("release-notes/history.json","w"))
app=open("app.html").read()
open("index.html","w").write(app.replace("BODY",'<taglore-whats-new src="/release-notes/latest.json" storage-key="demo" show-on-first-visit label-heading="What&#39;s new"></taglore-whats-new>').replace("CONTENT",open("cards.html").read()))
open("changelog.html","w").write(app.replace("BODY","").replace("CONTENT",'<taglore-changelog src="/release-notes/history.json"></taglore-changelog>'))
