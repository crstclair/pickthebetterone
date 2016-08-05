SELECT 
	log.id, 
	timestamp, 
	log_actions.name AS action, 
	headers, 
	ip_address, 
	users.username AS user, 
	tng1.name AS winning_thing,
	thing1_start_elo AS winning_thing_start_elo,
	thing1_end_elo AS winning_thing_end_elo,
	tng2.name AS losing_thing,
	thing2_start_elo AS losing_thing_start_elo,
	thing2_end_elo AS losing_thing_end_elo,
	tngnew.name AS new_thing,
	start_value,
	end_value
FROM log
LEFT JOIN 
	log_actions ON (log.action = log_actions.id)
LEFT JOIN
	users ON (log.user = users.id)
LEFT JOIN
	things tng1 ON (log.thing1 = tng1.id)
LEFT JOIN
	things tng2 ON (log.thing2 = tng2.id)
LEFT JOIN
	things tngnew ON (log.thing_submitted = tngnew.id)