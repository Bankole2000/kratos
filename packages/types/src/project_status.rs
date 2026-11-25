//! The status of a project (FR-003).

use std::fmt;
use std::str::FromStr;

use serde::{Deserialize, Serialize};

/// Where a project is in its life. FR-003 allows exactly these five values; any other value
/// is rejected.
///
/// In JSON and in text it is written in `snake_case`: `"idea"`, `"active"`, `"paused"`,
/// `"shipped"`, `"abandoned"`. Serde, [`ProjectStatus::as_str`], `Display` and `FromStr` all
/// use the same strings.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ProjectStatus {
    /// Not started yet; just an idea.
    Idea,
    /// Being worked on.
    Active,
    /// Work has stopped for now but may resume.
    Paused,
    /// Released to users.
    Shipped,
    /// Work has stopped for good.
    Abandoned,
}

impl ProjectStatus {
    /// Every status, in lifecycle order. Useful for tests and for listing the choices.
    pub const ALL: [ProjectStatus; 5] = [
        ProjectStatus::Idea,
        ProjectStatus::Active,
        ProjectStatus::Paused,
        ProjectStatus::Shipped,
        ProjectStatus::Abandoned,
    ];

    /// The status as its wire string, e.g. `"shipped"`.
    pub fn as_str(self) -> &'static str {
        match self {
            ProjectStatus::Idea => "idea",
            ProjectStatus::Active => "active",
            ProjectStatus::Paused => "paused",
            ProjectStatus::Shipped => "shipped",
            ProjectStatus::Abandoned => "abandoned",
        }
    }
}

/// Writes the wire string, so `status.to_string()` gives e.g. `"active"`.
impl fmt::Display for ProjectStatus {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str(self.as_str())
    }
}

/// Parses the wire string, so `"paused".parse::<ProjectStatus>()` works. Matching is exact:
/// `"Paused"` or `" paused"` are rejected.
impl FromStr for ProjectStatus {
    type Err = ParseProjectStatusError;

    fn from_str(value: &str) -> Result<Self, Self::Err> {
        match value {
            "idea" => Ok(ProjectStatus::Idea),
            "active" => Ok(ProjectStatus::Active),
            "paused" => Ok(ProjectStatus::Paused),
            "shipped" => Ok(ProjectStatus::Shipped),
            "abandoned" => Ok(ProjectStatus::Abandoned),
            _ => Err(ParseProjectStatusError {
                value: value.to_string(),
            }),
        }
    }
}

/// Returned when a string is not one of the five project statuses.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ParseProjectStatusError {
    value: String,
}

impl ParseProjectStatusError {
    /// The string that was rejected.
    pub fn value(&self) -> &str {
        &self.value
    }
}

impl fmt::Display for ParseProjectStatusError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(
            f,
            "unknown project status {:?}; expected one of: idea, active, paused, shipped, abandoned",
            self.value
        )
    }
}

impl std::error::Error for ParseProjectStatusError {}

#[cfg(test)]
mod tests {
    use super::*;

    /// Each status paired with the exact string FR-003 uses for it.
    const EXPECTED: [(ProjectStatus, &str); 5] = [
        (ProjectStatus::Idea, "idea"),
        (ProjectStatus::Active, "active"),
        (ProjectStatus::Paused, "paused"),
        (ProjectStatus::Shipped, "shipped"),
        (ProjectStatus::Abandoned, "abandoned"),
    ];

    #[test]
    fn serializes_to_exact_json_strings() {
        for (status, text) in EXPECTED {
            let json = serde_json::to_string(&status).unwrap();
            assert_eq!(json, format!("\"{text}\""));
        }
    }

    #[test]
    fn deserializes_from_exact_json_strings() {
        for (status, text) in EXPECTED {
            let parsed: ProjectStatus = serde_json::from_str(&format!("\"{text}\"")).unwrap();
            assert_eq!(parsed, status);
        }
    }

    #[test]
    fn json_round_trip_keeps_every_status() {
        for status in ProjectStatus::ALL {
            let json = serde_json::to_string(&status).unwrap();
            let back: ProjectStatus = serde_json::from_str(&json).unwrap();
            assert_eq!(back, status);
        }
    }

    #[test]
    fn display_and_from_str_use_the_serde_strings() {
        for (status, text) in EXPECTED {
            assert_eq!(status.as_str(), text);
            assert_eq!(status.to_string(), text);
            assert_eq!(text.parse::<ProjectStatus>().unwrap(), status);
        }
    }

    #[test]
    fn all_lists_every_status_once() {
        let from_expected: Vec<ProjectStatus> = EXPECTED.iter().map(|(s, _)| *s).collect();
        assert_eq!(ProjectStatus::ALL.to_vec(), from_expected);
    }

    #[test]
    fn rejects_unknown_status_in_json() {
        for bad in ["\"done\"", "\"Active\"", "\"\"", "1", "null"] {
            let result: Result<ProjectStatus, _> = serde_json::from_str(bad);
            assert!(result.is_err(), "{bad} should be rejected");
        }
    }

    #[test]
    fn rejects_unknown_status_in_from_str() {
        for bad in ["done", "Active", " paused", ""] {
            let error = bad.parse::<ProjectStatus>().unwrap_err();
            assert_eq!(error.value(), bad);
        }
    }

    #[test]
    fn error_message_names_the_value_and_the_choices() {
        let error = "done".parse::<ProjectStatus>().unwrap_err();
        assert_eq!(
            error.to_string(),
            "unknown project status \"done\"; expected one of: idea, active, paused, shipped, abandoned"
        );
    }
}
