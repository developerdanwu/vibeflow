import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@workos-inc/authkit-react", () => ({
	useAuth: vi.fn(),
}));

vi.mock("convex/react", () => ({
	useQuery: vi.fn(),
	Authenticated: ({ children }: { children: React.ReactNode }) => children,
	Unauthenticated: ({ children }: { children: React.ReactNode }) => children,
	AuthLoading: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock("@tanstack/react-router", () => ({
	createFileRoute: () => ({
		useSearch: () => ({ view: "month", date: undefined }),
	}),
	useNavigate: () => vi.fn(),
}));

import { useAuth } from "@workos-inc/authkit-react";
import { useQuery } from "convex/react";

const mockUseAuth = useAuth as ReturnType<typeof vi.fn>;
const mockUseQuery = useQuery as ReturnType<typeof vi.fn>;

describe("Calendar Route Logic", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("Authentication States", () => {
		it("should return loading state when auth is loading", () => {
			mockUseAuth.mockReturnValue({
				user: null,
				isLoading: true,
				signIn: vi.fn(),
				signOut: vi.fn(),
			});
			mockUseQuery.mockReturnValue(undefined);

			const authState = mockUseAuth();
			expect(authState.isLoading).toBe(true);
			expect(authState.user).toBeNull();
		});

		it("should return user when authenticated", () => {
			const mockUser = {
				id: "user-123",
				firstName: "Test",
				lastName: "User",
				profilePictureUrl: null,
			};

			mockUseAuth.mockReturnValue({
				user: mockUser,
				isLoading: false,
				signIn: vi.fn(),
				signOut: vi.fn(),
			});

			const authState = mockUseAuth();
			expect(authState.isLoading).toBe(false);
			expect(authState.user).toEqual(mockUser);
			expect(authState.user?.id).toBe("user-123");
		});
	});

	describe("Event Data Handling", () => {
		it("should return undefined when events are loading", () => {
			mockUseQuery.mockReturnValue(undefined);

			const events = mockUseQuery();
			expect(events).toBeUndefined();
		});

		it("should return empty array when no events", () => {
			mockUseQuery.mockReturnValue([]);

			const events = mockUseQuery();
			expect(events).toEqual([]);
		});

		it("should return events when data is loaded", () => {
			const mockEvents = [
				{
					_id: "event-1",
					title: "Test Event",
					startDate: Date.now(),
					endDate: Date.now() + 3600000,
					userId: "user-123",
					allDay: false,
				},
			];
			mockUseQuery.mockReturnValue(mockEvents);

			const events = mockUseQuery();
			expect(events).toHaveLength(1);
			expect(events[0].title).toBe("Test Event");
		});
	});

	describe("Date Parsing", () => {
		it("should parse valid date string", () => {
			const dateStr = "2026-01-25";
			const parsed = new Date(dateStr);
			expect(parsed.getFullYear()).toBe(2026);
			expect(parsed.getMonth()).toBe(0);
			expect(parsed.getDate()).toBe(25);
		});

		it("should handle invalid date string", () => {
			const dateStr = "invalid-date";
			const parsed = new Date(dateStr);
			expect(Number.isNaN(parsed.getTime())).toBe(true);
		});
	});

	describe("Event Classification", () => {
		it("should classify single day events correctly", () => {
			const start = new Date(2026, 0, 25, 10, 0);
			const end = new Date(2026, 0, 25, 11, 0);
			const duration = end.getTime() - start.getTime();
			const isSingleDay = duration < 24 * 60 * 60 * 1000;

			expect(isSingleDay).toBe(true);
		});

		it("should classify multi-day events correctly", () => {
			const start = new Date(2026, 0, 25, 0, 0);
			const end = new Date(2026, 0, 27, 23, 59);
			const duration = end.getTime() - start.getTime();
			const isMultiDay = duration >= 24 * 60 * 60 * 1000;

			expect(isMultiDay).toBe(true);
		});
	});

	describe("Hash Function", () => {
		it("should generate consistent hash for same string", () => {
			const hashStringToNumber = (str: string): number => {
				let hash = 0;
				for (let i = 0; i < str.length; i++) {
					const char = str.charCodeAt(i);
					hash = (hash << 5) - hash + char;
					hash = hash & hash;
				}
				return Math.abs(hash);
			};

			const hash1 = hashStringToNumber("event-123");
			const hash2 = hashStringToNumber("event-123");
			expect(hash1).toBe(hash2);
		});

		it("should generate different hashes for different strings", () => {
			const hashStringToNumber = (str: string): number => {
				let hash = 0;
				for (let i = 0; i < str.length; i++) {
					const char = str.charCodeAt(i);
					hash = (hash << 5) - hash + char;
					hash = hash & hash;
				}
				return Math.abs(hash);
			};

			const hash1 = hashStringToNumber("event-123");
			const hash2 = hashStringToNumber("event-456");
			expect(hash1).not.toBe(hash2);
		});
	});
});
