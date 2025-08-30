using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace backend.Services
{
	[Authorize]
	public class ChatHub : Hub { }
}


