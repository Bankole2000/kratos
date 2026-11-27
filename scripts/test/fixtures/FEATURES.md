# Features (test fixture)

Status: Approved | Owner: @x | Version: 1.0 | Last updated: 2026-01-01

## Journeys
| ID | Name | Main user | Goal | Features, in order | Milestone |
|---|---|---|---|---|---|
| J-01 | Get started | U-01 | Have an account | FT-001, FT-002 | M2 |
| J-12 | Set up zones | U-02 | Zones and staff are ready | FT-070, FT-071, FT-072, FT-073, FT-074 | M1 |

## Features
| ID | User | Action | Resource | Scope | Surfaces | Outcome | Priority | Depends on | Journey | Requirements | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|
| FT-001 | U-01 | A-01 | R-01 | — | S-01 | x | Must | — | J-01 | FR-001 | approved |
| FT-002 | U-01 | A-02 | R-01 | — | S-01 | x | Should | FT-001 | J-01 | FR-001 | proposed |
| FT-070 | U-02 | A-01 | R-02 | — | S-02 | x | Must | — | J-12 | FR-001 | approved |
| FT-071 | U-02 | A-03 | R-02 | — | S-02 | x | Must | FT-070 | J-12 | FR-001 | approved |
| FT-072 | U-02 | A-02 | R-02 | — | S-02 | x | Must | FT-070 | J-12 | FR-001 | approved |
| FT-073 | U-02 | A-04 | R-02 | — | S-02 | x | Should | FT-070 | J-12 | FR-001 | approved |
| FT-074 | U-02 | A-05 | R-03 | — | S-02 | x | Could | FT-070 | J-12 | FR-001 | deferred |
