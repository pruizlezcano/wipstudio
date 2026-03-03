# Changelog

All notable changes to this project will be documented in this file. See [commit-and-tag-version](https://github.com/absolute-version/commit-and-tag-version) for commit guidelines.

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
