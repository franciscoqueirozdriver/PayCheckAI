# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.1] - 2025-08-26

### Fixed
- **404 Error for Favicon**: Added a `favicon.ico` file to the `public` directory to prevent browsers from receiving a 404 error when requesting the site icon.
- **Accessibility**: Verified that the Radix UI-based Dialog component (`ImportHoleriteModal`) correctly implements `<DialogTitle>` and `<DialogDescription>`, ensuring it meets accessibility standards.

## [1.0.0] - 2025-08-26

### Added
- Initial creation of the full-stack DSR Calculator application.
- API routes for payments, payslip import simulation, and user authentication.
- Frontend pages for the calculator and admin-only reports.
- Core business logic for DSR calculations.
- UI components including a reusable data table and an import modal.
- Authentication and authorization using NextAuth.js with admin/user roles.
- Styling configuration for Tailwind CSS and Shadcn UI.
