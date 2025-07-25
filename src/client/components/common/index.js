// Export all reusable components for easy importing
export { default as DataTable } from './DataTable'
export { default as SidePanel, DetailsTab, ActivityTab, NotesTab } from './SidePanel'
export { default as PageWrapper, SimplePage, DashboardPage, FormPage } from './PageWrapper'
export { default as ConfirmationModal, showConfirmationModal, confirmDelete, confirmAction, confirmDestructive } from './ConfirmationModal'
export { default as DataPopover, UserPopover, ItemPopover, QuickInfoPopover } from './DataPopover'
export { default as LoadingSpinner } from './LoadingSpinner'

// Re-export common utilities
export * from './DataTable'
export * from './SidePanel'
export * from './PageWrapper'
export * from './ConfirmationModal'
export * from './DataPopover' 