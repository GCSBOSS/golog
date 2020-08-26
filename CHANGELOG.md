# GoLog Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [v0.3.1] - 2020-08-26

### Fixed
- bug parsing `req` object to consider `IncomingMessage` instead of `ClientRequest`

## [v0.3.0] - 2020-08-26

### Added
- `defaults` option for setting fields to appear on every entry

### Removed
- `app` logger configuration

## [v0.2.0] - 2020-08-23

### Added
- log coloring
- auto-parsing of specific fields
- function to filter out by log level
- function to filter out by log type

### Changed
- entire interface for logging to stdout

### Removed
- support for direct file/stream writing

## [v0.1.2] - 2019-10-15

### Fixed
- 'err' log entry stack array to not contain ending empty string
- file stream creation to append instead of overwrite

## [v0.1.1] - 2019-09-26

### Fixed
- `error` event to not throw an exception when not handled

## [v0.1.0] - 2019-09-25
- First officially published version.

[v0.1.0]: https://gitlab.com/GCSBOSS/golog/-/tags/v0.1.0
[v0.1.1]: https://gitlab.com/GCSBOSS/golog/-/tags/v0.1.1
[v0.1.2]: https://gitlab.com/GCSBOSS/golog/-/tags/v0.1.2
[v0.2.0]: https://gitlab.com/GCSBOSS/golog/-/tags/v0.2.0
[v0.3.0]: https://gitlab.com/GCSBOSS/golog/-/tags/v0.3.0
[v0.3.1]: https://gitlab.com/GCSBOSS/golog/-/tags/v0.3.1
