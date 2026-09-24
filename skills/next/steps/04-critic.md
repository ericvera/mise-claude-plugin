# Critic

Spawn a round of `critic`s over `spec.md`, or, after `amend .mise --critic`, over that amendment's task files alone, each prompt also naming it as `Amendment:`. Between rounds, send the blocking findings you accept to a `planner` as `Findings:`. Stop when a round returns no blocking finding you have not already fixed or declined, with a hard cap of 5 rounds. Then `mark .mise critic done`.
