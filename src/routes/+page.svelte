<script lang="ts">
	import { goto } from '$app/navigation';
	// import data from './data.json';
	import dataset from './fakedata.json';
	import fakedata from './fakedata.json';
	import { browser } from '$app/environment';
	import type { PageData } from './$types';
	type Person = (typeof fakedata.data)[0];
	type LimitFilter = {
		type: 'limit';
		filter: {
			min: number;
			max: number;
			key: keyof Person;
		};
	};
	type SortFilter = {
		type: 'sort';
		filter: {
			order: 'asc' | 'desc';
			key: keyof Person;
		};
	};
	type Filter = SortFilter | LimitFilter;

	export let data: PageData;
	export let query = (data.query as string) || '';
	let page = 1;
	let pageSize = 50;
	let newFilter: string;
	let filtered: Person[];
	let filters: Filter[] = (data.filters as Filter[]) || [];

	const debounce = <T extends ('asc' | 'desc') | number>(
		node: Node,
		config: { delay?: number; type?: T; callback: (s: T) => void }
	) => {
		const { delay = 250, callback } = config;
		let timer: ReturnType<typeof setTimeout>;
		const handleChange = (e: any) => {
			const { value } = e.currentTarget;
			clearTimeout(timer);
			timer = setTimeout(() => {
				callback(value);
			}, delay);
		};
		node.addEventListener('input', handleChange);
		return {
			destroy() {
				node.removeEventListener('input', handleChange);
			}
		};
	};
	const getKeys = Object.keys as <T extends object>(obj: T) => Array<keyof T>;
	const isLimitFilter = (value: LimitFilter | SortFilter): value is LimitFilter => {
		return value.type === 'limit';
	};

	const addFilter = () => {
		filters.push(
			newFilter.endsWith('limit')
				? {
						type: 'limit',
						filter: {
							key: newFilter.replace(' limit', '') as keyof Person,
							max: 100,
							min: 0
						}
				  }
				: {
						type: 'sort',
						filter: {
							key: newFilter.replace(' sort', '') as keyof Person,
							order: 'asc'
						}
				  }
		);
		filters = filters;
	};
	const removeFilter = (i: number) => {
		filters.splice(i, 1);
		filters = filters;
	};

	$: {
		const regex = new RegExp(query.toLowerCase());
		filtered = dataset.data.filter((val) => val.value.toLowerCase().match(regex));

		filters.forEach((filter) => {
			if (filter.type === 'limit')
				filtered = filtered.filter(
					(val) =>
						filter.filter.min < val[filter.filter.key] && val[filter.filter.key] < filter.filter.max
				);
			else
				filtered = filtered.sort((a, b) => {
					if (filter.filter.order === 'asc') {
						return (a[filter.filter.key] as number) - (b[filter.filter.key] as number);
					}
					return (b[filter.filter.key] as number) - (a[filter.filter.key] as number);
				});
		});

		if (browser && query !== '')
			goto(
				`?${new URLSearchParams({
					query,
					filters: JSON.stringify(filters)
				}).toString()}`,
				{
					keepFocus: true,
					replaceState: true,
					noScroll: true
				}
			);
	}
</script>

<label>
	Query
	<input bind:value={query} />
</label>
<label>
	Page
	<input bind:value={page} type="number" />
</label>
<label>
	Page Size
	<input bind:value={pageSize} type="number" />
</label>
<p>
	<button on:click={addFilter}>Add filter</button>
	<select bind:value={newFilter}>
		<optgroup label="Limit">
			{#each getKeys(fakedata.data[0]).filter((val) => typeof fakedata.data[0][val] === 'number') as key}
				<option>{key} limit</option>
			{/each}
		</optgroup>
		<optgroup label="Sort">
			{#each getKeys(fakedata.data[0]).filter((val) => typeof fakedata.data[0][val] === 'number') as key}
				<option>{key} sort</option>
			{/each}
		</optgroup>
	</select>
</p>
{#each filters as filter, i}
	<p>
		{#if filter.type === 'limit'}
			{filter.filter.key}
			<label>
				Max
				<input
					type="number"
					value="100"
					use:debounce={{
						type: 0,
						callback: (value) => {
							if (isLimitFilter(filter)) filter.filter.max = value;
						}
					}}
				/>
			</label>
			<label>
				Min
				<input
					type="number"
					value="0"
					use:debounce={{
						type: 0,
						callback: (value) => {
							if (isLimitFilter(filter)) filter.filter.min = value;
						}
					}}
					min="0"
				/>
			</label>
		{:else}
			{filter.filter.key}
			{filter.filter.order}
			<select
				use:debounce={{
					type: 'asc',
					callback: (value) => {
						if (!isLimitFilter(filter)) filter.filter.order = value;
					}
				}}
			>
				<option>asc</option>
				<option>desc</option>
			</select>
		{/if}
		<button on:click={() => removeFilter(i)}>Remove</button>
		<button
			on:click={() => {
				if (i > 0) {
					filters.splice(i - 1, 0, filters.splice(i, 1)[0]);
					filters = filters;
				}
			}}>move up</button
		>
		<button
			on:click={() => {
				if (i + 1 < filters.length) {
					filters.splice(i + 1, 0, filters.splice(i, 1)[0]);
					filters = filters;
				}
			}}>move down</button
		>
	</p>
{/each}
<table>
	<thead>
		<tr>
			{#each getKeys(fakedata.data[0]) as key}
				<th>
					{key}
				</th>
			{/each}
		</tr>
	</thead>
	<tbody>
		{#each filtered.slice(pageSize * (page - 1), pageSize * page) as person}
			<tr>
				{#each Object.values(person) as value}
					<td>{value}</td>
				{/each}
			</tr>
		{/each}
	</tbody>
</table>
