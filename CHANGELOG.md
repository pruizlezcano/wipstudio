# Changelog

All notable changes to this project will be documented in this file. See [commit-and-tag-version](https://github.com/absolute-version/commit-and-tag-version) for commit guidelines.

## [0.9.0](https://github.com/pruizlezcano/wipstudio/compare/v0.8.0...v0.9.0) (2026-06-04)


### Features

* add server-side waveform peak and duration caching ([8fea746](https://github.com/pruizlezcano/wipstudio/commit/8fea746f293ef611e92f6b029fc5a81d4d453a51)), closes [#17](https://github.com/pruizlezcano/wipstudio/issues/17)


### Bug Fixes

* include zod validation details in error toasts ([51b7c1a](https://github.com/pruizlezcano/wipstudio/commit/51b7c1a280a2b5dc5d9a9682039265b1fd381130))
* **player:** keep waveform mounted when switching version ([abb6ba9](https://github.com/pruizlezcano/wipstudio/commit/abb6ba9f1b97a8967572643eb3d48e7c98bb1c03))
* **track:** improve mobile layout ([357e42b](https://github.com/pruizlezcano/wipstudio/commit/357e42b2c5b97880c479ca882f8a426bb78d3e6f))
* **track:** stabilize version waveform layout ([22433b9](https://github.com/pruizlezcano/wipstudio/commit/22433b92332999b766783bc95bdd1da2375d534c)), closes [#14](https://github.com/pruizlezcano/wipstudio/issues/14)
* **validation:** update maximum artwork length ([a8d6715](https://github.com/pruizlezcano/wipstudio/commit/a8d67158b948c08b6fd13cf1515f081d6aaeeedd)), closes [#15](https://github.com/pruizlezcano/wipstudio/issues/15)

## [0.8.0](https://github.com/pruizlezcano/wipstudio/compare/v0.7.0...v0.8.0) (2026-05-28)


### Features

* add project artwork and simplify project visuals ([8059314](https://github.com/pruizlezcano/wipstudio/commit/80593147713cd3e324708516a8735983f544d9a6)), closes [#7](https://github.com/pruizlezcano/wipstudio/issues/7)
* **player:** reuse waveform instances for seamless version switching ([09e8805](https://github.com/pruizlezcano/wipstudio/commit/09e8805e7f81c73c220fbd024b2d65f44fef03f6)), closes [#2](https://github.com/pruizlezcano/wipstudio/issues/2) [#11](https://github.com/pruizlezcano/wipstudio/issues/11) [#12](https://github.com/pruizlezcano/wipstudio/issues/12)


### Bug Fixes

* **api:** remove owner fields via destructuring in project routes ([ee3ad17](https://github.com/pruizlezcano/wipstudio/commit/ee3ad17e599af4a358a53728b93bd2e2a1fc9e52))
* **track:** disable version selection until waveforms load ([5002509](https://github.com/pruizlezcano/wipstudio/commit/5002509e3e7dd57ac7645ed146747f8e6556c70c))

## [0.7.0](https://github.com/pruizlezcano/wipstudio/compare/v0.6.0...v0.7.0) (2026-05-11)


### ⚠ BREAKING CHANGES

* `MINIO_HOST` and `MINIO_PORT` environment variables
have been removed. Use `S3_HOST` and `S3_PORT` instead.


### Features

* add keyboard shortcuts and centralized state management ([4bafd15](https://github.com/pruizlezcano/wipstudio/commit/4bafd157023e14ca219234ee1439f277bca71a23))
* **auth:** add `OPENID_ENABLED` environment variable ([6e07a1c](https://github.com/pruizlezcano/wipstudio/commit/6e07a1c9399f4f4098628ac7abd6bd6fb2631f72)), closes [#8](https://github.com/pruizlezcano/wipstudio/issues/8)
* **invitations:** support multiple email recipients ([78d6b84](https://github.com/pruizlezcano/wipstudio/commit/78d6b84bc525117ebf6a0f76c2d6e632e4c00fe9))
* **invitations:** support restricting invite to email ([f137995](https://github.com/pruizlezcano/wipstudio/commit/f1379958c525630f6b1a4d6eefca72a9459a592d))
* **projects:** allow collaborators to leave projects ([22d3a30](https://github.com/pruizlezcano/wipstudio/commit/22d3a30e06e661009096b8919e2c28480d634151))
* **projects:** unify owner and collaborators in member list ([3e88ea2](https://github.com/pruizlezcano/wipstudio/commit/3e88ea2bfa9eb10b57b04b296b72eb14f5d5ab05))


### Bug Fixes

* close project and track dialogs on success ([0ed2efc](https://github.com/pruizlezcano/wipstudio/commit/0ed2efc097f68cfc6b1a1c7bce34ce3b9e48a8c6))
* **docker:** update postgres volume mount path ([3ff6afe](https://github.com/pruizlezcano/wipstudio/commit/3ff6afeddaaf3b87047b36991f19564dabddcb52))
* **tracks:** isolate version notes in edit dialog ([6ded2bf](https://github.com/pruizlezcano/wipstudio/commit/6ded2bf3166139338fc8e75b11d9e7ed6de8da68)), closes [#3](https://github.com/pruizlezcano/wipstudio/issues/3)

## [0.6.0](https://github.com/pruizlezcano/wipstudio/compare/v0.5.0...v0.6.0) (2026-03-03)


### Features

* **comments:** add sorting by date and audio timestamp ([fd506e8](https://github.com/pruizlezcano/wipstudio/commit/fd506e8469da8396f35cd27c166e5062a543d3ee))
* **comments:** allow users to edit their own comments ([4b2bfd6](https://github.com/pruizlezcano/wipstudio/commit/4b2bfd6f437d5173a3e215ba23338da13aa0ea0f))
* **lyrics:** add real-time collaborative editor ([9fd13a1](https://github.com/pruizlezcano/wipstudio/commit/9fd13a192d586f3fd5040a9399a090911a370fbf))
* **lyrics:** implement collaborative commenting system ([12069d5](https://github.com/pruizlezcano/wipstudio/commit/12069d5899e95dbbcc3d373291313d79f6794765))
* **lyrics:** add comment notifications and deep linking ([fdc0c87](https://github.com/pruizlezcano/wipstudio/commit/fdc0c875e6dcdaa729b23a36d429d2600256d3cc))


### Bug Fixes

* **comments:** preserve whitespace in comment content ([e85f0be](https://github.com/pruizlezcano/wipstudio/commit/e85f0bea59311f282ab69641e4c02ecb9f5091ea))
* **tracks:** correct versionCount and standardize track DTOs ([0fe43f4](https://github.com/pruizlezcano/wipstudio/commit/0fe43f48ea4ca213ac1359d870841ac7457a82de))

## [0.5.0](https://github.com/pruizlezcano/wipstudio/compare/v0.4.0...v0.5.0) (2026-02-25)


### Features

* **comments:** allow seeking to timestamp in comment form ([183ebcd](https://github.com/pruizlezcano/wipstudio/commit/183ebcd981e5e8a8c61f447e3824dd3e6bafdef0))
* **player:** add media session support and optimize track metadata fetching ([6b15d0d](https://github.com/pruizlezcano/wipstudio/commit/6b15d0d2771e0d63e9d604741b2d0a95c44ae8ca))
* **player:** add start time support to loadVersion ([a45ca7c](https://github.com/pruizlezcano/wipstudio/commit/a45ca7c77211dff267128755d0ec32f2b97d0fa3))
* **tracks:** add inline playback support to track list ([32e7231](https://github.com/pruizlezcano/wipstudio/commit/32e72318e7753e253713b67c1f12bb4b951c40cf))
* **tracks:** pluralize track version count ([f6008d0](https://github.com/pruizlezcano/wipstudio/commit/f6008d03ddd8f245822ec2fff4b42c078acb2faf))
* **ui:** improve mobile responsiveness ([83d91df](https://github.com/pruizlezcano/wipstudio/commit/83d91df304980c3a2f46f2629629c7eb76d1803e))
* **waveform:** extract WaveformTimer and improve playback sync ([f4ef1f9](https://github.com/pruizlezcano/wipstudio/commit/f4ef1f9c763cf0442f1cce1eca0f9afd7e734ee4))


### Bug Fixes

* **player:** sync play state and time across components ([2e23f00](https://github.com/pruizlezcano/wipstudio/commit/2e23f0094d2e220beb8a5ddc84e5e2c6cd4fe32f))
* **waveform:** use resolvedTheme instead of theme ([cd8d87a](https://github.com/pruizlezcano/wipstudio/commit/cd8d87a06fdf1b1dc8f9271c781ff3fa7ee64447))

## [0.4.0](https://github.com/pruizlezcano/wipstudio/compare/v0.3.0...v0.4.0) (2026-01-28)


### Features

* add ErrorState component and global error handling ([c668f23](https://github.com/pruizlezcano/wipstudio/commit/c668f232dd5257f6b1a601f7928d96b6a3d80d6b))
* add lastVersionAt and update sorting for projects and tracks ([ea4c961](https://github.com/pruizlezcano/wipstudio/commit/ea4c9610f2656799351b8178b0a80219053bbb16))
* display stacked user avatars for project participants on project cards ([6d585df](https://github.com/pruizlezcano/wipstudio/commit/6d585df8929d3196a2f246821431b1ff96a93670))
* **projects:** displayrefactor: implement ApiError and status-based retry logic ([1c27e63](https://github.com/pruizlezcano/wipstudio/commit/1c27e635e3fa5d2f88cfae4bc92ec6035245e650))
* **tracks:** add track version download ([54aad0c](https://github.com/pruizlezcano/wipstudio/commit/54aad0c0db602fe9a167b04d062836b77644d735))


### Bug Fixes

* **hooks:** invalidate project lists after collaborator removal and standardize project list invalidation using `projectKeys.lists()` on invitation acceptance ([7f163eb](https://github.com/pruizlezcano/wipstudio/commit/7f163ebc11e921776a387582769c9bb1995f0086))
* prevent duplicate audio requests by caching peaks ([4d5f812](https://github.com/pruizlezcano/wipstudio/commit/4d5f8121bbcc1a86f70014a2304556b7ffa98a53))
* **tracks:** missing version count in patch response ([19eee13](https://github.com/pruizlezcano/wipstudio/commit/19eee130ca1b33b0b8a87a54c8b5cd278d297c2a))

## [0.3.0](https://github.com/pruizlezcano/wipstudio/compare/v0.2.0...v0.3.0) (2026-01-15)


### Features

* **nav-bar:** add logo ([c5bd8ed](https://github.com/pruizlezcano/wipstudio/commit/c5bd8edfc7cafb3ddd28ac6b746a0b10d1044961))
* **projects:** navigate to new project on creation ([c09dcf7](https://github.com/pruizlezcano/wipstudio/commit/c09dcf73c5c106fce96ddcc843427225fb17cde1))
* **tracks:** navigate to new track after upload ([c6249f6](https://github.com/pruizlezcano/wipstudio/commit/c6249f65b2c95b3a505c073e67f0134f58feb4f0))


### Bug Fixes

* **tracks:** display updatedAt instead of createdAt ([9c08956](https://github.com/pruizlezcano/wipstudio/commit/9c08956160a92c54794c21168caf44e281c865a7))

## [0.2.0](https://github.com/pruizlezcano/wipstudio/compare/v0.1.0...v0.2.0) (2026-01-13)


### Features

* **projects:** add infinite scroll pagination ([b3aaa16](https://github.com/pruizlezcano/wipstudio/commit/b3aaa16a86a66630e8138533cd454595d1fb7924))
* **projects:** add project list sorting ([d6fb8bc](https://github.com/pruizlezcano/wipstudio/commit/d6fb8bc6530a95c329c2a638bf159d087c6e1032))
* **tracks:** add infinite scroll pagination ([1cc08da](https://github.com/pruizlezcano/wipstudio/commit/1cc08da7004111a28924fb39d24d7412aedd1d9b))
* **tracks:** add track sorting functionality ([a90429c](https://github.com/pruizlezcano/wipstudio/commit/a90429c967588f8e6d44ba45953ffa28f4e02d2d))


### Bug Fixes

* **env:** fixes Next.js runtime env var access ([f3e2b72](https://github.com/pruizlezcano/wipstudio/commit/f3e2b72f05214b104f6cbf4f8847ecd5d2456fa6))
