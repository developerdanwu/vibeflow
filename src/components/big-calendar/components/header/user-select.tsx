import { useCalendar } from "@/components/big-calendar/contexts/calendar-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AvatarGroup } from "@/components/ui/avatar-group";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

export function UserSelect() {
	const [users] = useCalendar((s) => s.context.users);
	const [selectedUserId, store] = useCalendar((s) => s.context.selectedUserId);

	return (
		<Select
			value={selectedUserId}
			onValueChange={(userId) =>
				store.send({ type: "setSelectedUserId", userId })
			}
		>
			<SelectTrigger className="flex-1 md:w-48">
				<SelectValue />
			</SelectTrigger>

			<SelectContent align="end">
				<SelectItem value="all">
					<div className="flex items-center gap-1">
						<AvatarGroup max={2}>
							{users.map((user) => (
								<Avatar key={user.id} className="size-6 text-xxs">
									<AvatarImage
										src={user.picturePath ?? undefined}
										alt={user.name}
									/>
									<AvatarFallback className="text-xxs">
										{user.name[0]}
									</AvatarFallback>
								</Avatar>
							))}
						</AvatarGroup>
						All
					</div>
				</SelectItem>

				{users.map((user) => (
					<SelectItem key={user.id} value={user.id} className="flex-1">
						<div className="flex items-center gap-2">
							<Avatar key={user.id} className="size-6">
								<AvatarImage
									src={user.picturePath ?? undefined}
									alt={user.name}
								/>
								<AvatarFallback className="text-xxs">
									{user.name[0]}
								</AvatarFallback>
							</Avatar>

							<p className="truncate">{user.name}</p>
						</div>
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}
