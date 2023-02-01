<script lang="ts">
	import { goto } from '$app/navigation';
	// import dataset from './data.json';
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

	// url-encoded filters loaded in +page.ts
	export let data: PageData;
	// Main regex-based query
	let query = (data.query as string) || '';
	// Pagination page, page size
	let page = 1;
	let pageSize = 50;
	// Temporary variable for creating new filters
	let newFilter: string;
	// Filtered data
	let filtered: Person[];
	// Filters loaded from data
	let filters: Filter[] = (data.filters as Filter[]) || [];

	/**
	 * Debounce that accepts a generic T that can be either ('asc' | 'desc') or a number
	 *
	 * @param node passed automatically to function by Svelte's use directive
	 * @param config
	 */
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

	/**
	 * Object.keys returns `string[]` and not `keyof Object`, so we need this little helper
	 * so TypeScript doesn't yell at us.
	 */
	const getKeys = Object.keys as <T extends object>(obj: T) => Array<keyof T>;

	/**
	 * We can't use TypeScript in Sveltes html sections because of how preprecessors work,
	 * so we need this helper to assert that value is a `LimitHelper`
	 * @param value
	 */
	const isLimitFilter = (value: LimitFilter | SortFilter): value is LimitFilter => {
		return value.type === 'limit';
	};

	/**
	 * Add a new filter based on if `newFilter` is a `limit` or `sort` filter.
	 * At the end we assign `filters` to itself because Svelte doesn't detect
	 * mutation through methods like `push()`.
	 */
	const addFilter = () => {
		filters.push(
			newFilter.endsWith('limit')
				? {
						type: 'limit',
						filter: {
							// Remove the limit | sort suffix
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

	/**
	 * Reactive block that gets re-run whenever a variable used inside chages.
	 */
	$: {
		// We rebuild the regex from the query
		const regex = new RegExp(query.toLowerCase());
		// And filter the dataset
		filtered = dataset.data.filter((val) => val.value.toLowerCase().match(regex));

		filters.forEach((filter) => {
			// All filters work exclusively on numbers
			if (filter.type === 'limit')
				// Filter numbers so that `max > n > min`
				filtered = filtered.filter(
					(val) =>
						filter.filter.min < val[filter.filter.key] && val[filter.filter.key] < filter.filter.max
				);
			// Basic ascending // descending numeric sort
			else
				filtered = filtered.sort((a, b) => {
					if (filter.filter.order === 'asc') {
						return (a[filter.filter.key] as number) - (b[filter.filter.key] as number);
					}
					return (b[filter.filter.key] as number) - (a[filter.filter.key] as number);
				});
		});

		/** Wacky SvelteKit behaviour - this will try to run on the server in SSR mode,
		 * so to ensure this only runs on the client, we need to wrap it in `if (browser)`
		 */
		if (browser && query !== '')
			// To update search params in Kit, you use the goto fuction just like if you were navigating
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

<!-- The bind directive works like a on:input event handler that changes that value of a variable to event.target.value -->
<label>
	Query
	<!-- Main regex-based query -->
	<input bind:value={query} />
</label>
<label>
	Page
	<!-- Pagination page -->
	<input bind:value={page} type="number" />
</label>
<label>
	Page Size
	<!-- Pagination page size -->
	<input bind:value={pageSize} type="number" />
</label>
<p>
	<button on:click={addFilter}>Add filter</button>
	<select bind:value={newFilter}>
		<!-- loop over all the keys of the first object in the dataset, filter out non-numeric ones
      and add a limit | sort suffix  -->
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
<!-- Loop over all existing filters -->
{#each filters as filter, i}
	<p>
		<!-- Limit filters -->
		{#if filter.type === 'limit'}
			{filter.filter.key}
			<label>
				Max
				<input
					type="number"
					value="100"
					use:debounce={{
						// debounce is generic, but we can't provide types with ts syntax inside Sveltes HTML section. So we make a parameter of type T that then tells the rest of the fuction what type the values are.
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
				// In an {#each} block you can also get the index of the element in the array.
				if (i > 0) {
					filters.splice(i - 1, 0, filters.splice(i, 1)[0]);
					// Since splice mutates the array without using the assignment operator, we need to reassign the variable to itself to show Svelte this variable changes here and we need to re-render this element
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
			<!-- Show dataset object keys as table heads -->
			{#each getKeys(fakedata.data[0]) as key}
				<th>
					{key}
				</th>
			{/each}
		</tr>
	</thead>
	<tbody>
		<!-- Paginate the results, Svelte is fast but updating tens of thousands of DOM nodes is too much (unless we'd use a virtual list but that's not in the scope of this project. if you're interested in that, look at https://github.com/sveltejs/svelte-virtual-list written by the completely insane Rich Harris) -->
		{#each filtered.slice(pageSize * (page - 1), pageSize * page) as person}
			<tr>
				{#each Object.values(person) as value}
					<td>{value}</td>
				{/each}
			</tr>
		{/each}
	</tbody>
</table>
