# Gate

First rebase onto the latest base with `git fetch origin <base>` and `git rebase origin/<base>`, then force-push the rebased branch with `push .mise`. A conflict → `git rebase --abort` and stop, naming the conflicting files and asking the owner to rebase by hand, then run `/mise:next`. A failed push → relay it and stop. Then spawn one `runner` on the config's `Check` and `Unit tests`, then the e2e suite when a `required` Skills & guides entry names one, through that entry and never directly. Leave out a command that passed at the gate with no commit since.

A failure gets one repair through an implementer (`Fix scope:`, and `Defects:` holding the runner's report of the failure) and one re-run of the gate. A second failure → print it and stop. Handle the owner's reply as review feedback, by `06-review.md`, and the gate runs again once the fix lands. On success, `mark .mise gate done`.
